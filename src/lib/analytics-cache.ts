import { prisma } from "./prisma";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

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
}
