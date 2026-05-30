import { prisma } from "./prisma";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

// In-process single-flight: coalesce concurrent computes for the same key so a cold-cache
// dogpile (N simultaneous requests landing in the TTL gap) runs ONE compute instead of N.
// Without this, each concurrent caller fires its own upstream work — e.g. N parallel FRED
// streams that burst-trigger 429s and defeat the per-stream retry. With it, concurrent
// callers share the single sequential compute that's known to succeed.
// Caveat: this dedupes within a single process/instance only; on serverless, a burst spread
// across multiple instances still fans out, but each instance does at most one compute.
const inflight = new Map<string, Promise<unknown>>();

export async function getCachedJson<T>(
  key: string,
  ttlMs = FIVE_MINUTES_MS,
  compute: () => Promise<T>,
): Promise<T> {
  const existing = await prisma.kpi.findUnique({
    where: { key },
    select: { payload: true, lastComputedAt: true },
  });

  const fresh =
    existing?.lastComputedAt &&
    Date.now() - existing.lastComputedAt.getTime() < ttlMs;

  if (fresh && existing?.payload != null) {
    return existing.payload as unknown as T;
  }

  // Cache is cold/stale — if a compute for this key is already running, join it instead of
  // starting another. (No await between the get and set below, so this is race-free.)
  const pending = inflight.get(key);
  if (pending) return (await pending) as T;

  const run = (async () => {
    const value = await compute();
    const now = new Date();

    await prisma.kpi.upsert({
      where: { key },
      create: {
        key,
        name: `cache:${key}`,
        payload: value as never,
        lastComputedAt: now,
      },
      update: {
        payload: value as never,
        lastComputedAt: now,
      },
    });

    return value;
  })();

  inflight.set(key, run);
  try {
    return (await run) as T;
  } finally {
    // Always clear so the next cold window starts a fresh compute (even if this one failed).
    inflight.delete(key);
  }
}
