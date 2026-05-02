import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export const runtime = "nodejs";

const SESSION_IDLE_MS = 30 * 60 * 1000;

type HeartbeatBody = {
  sessionId?: string;
  referer?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  path?: string;
  ended?: boolean;
};

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: HeartbeatBody = {};
  try {
    body = (await req.json()) as HeartbeatBody;
  } catch {
    body = {};
  }

  const userAgent = req.headers.get("user-agent") ?? null;
  const now = new Date();
  const incomingSessionId =
    typeof body.sessionId === "string" && body.sessionId.length > 0
      ? body.sessionId
      : null;

  // lastActiveAt throttle — Postgres-side guard, no in-memory state needed.
  await prisma.$executeRaw`
    UPDATE "users"
    SET "last_active_at" = ${now}
    WHERE "id" = ${authUser.id}
      AND ("last_active_at" IS NULL OR "last_active_at" < NOW() - INTERVAL '5 minutes')
  `;

  // ── Tab close / pagehide ──
  // End ONLY the session this tab owns. Never touch other tabs' sessions.
  if (body.ended) {
    if (!incomingSessionId) {
      return NextResponse.json({ ok: true, ended: false, reason: "no sessionId" });
    }
    const existing = await prisma.userSession.findFirst({
      where: {
        id: incomingSessionId,
        userId: authUser.id,
        endedAt: null,
      },
      select: { id: true, startedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: true, ended: false });
    }
    const durationSec = Math.max(
      0,
      Math.floor((now.getTime() - existing.startedAt.getTime()) / 1000),
    );
    await prisma.userSession.update({
      where: { id: existing.id },
      data: { lastSeenAt: now, endedAt: now, durationSec },
    });
    return NextResponse.json({ ok: true, ended: true });
  }

  // ── Periodic ping ──
  // 1) If client sent a sessionId, try to reuse that exact session.
  if (incomingSessionId) {
    const existing = await prisma.userSession.findFirst({
      where: {
        id: incomingSessionId,
        userId: authUser.id,
        endedAt: null,
      },
      select: { id: true, startedAt: true, lastSeenAt: true },
    });

    if (existing) {
      const stale =
        now.getTime() - existing.lastSeenAt.getTime() > SESSION_IDLE_MS;
      if (!stale) {
        await prisma.userSession.update({
          where: { id: existing.id },
          data: { lastSeenAt: now },
        });
        return NextResponse.json({ ok: true, sessionId: existing.id });
      }
      // Stale: close it preserving the original last activity time so duration
      // doesn't get inflated by overnight idle gaps. Then create a new session below.
      const durationSec = Math.max(
        0,
        Math.floor(
          (existing.lastSeenAt.getTime() - existing.startedAt.getTime()) / 1000,
        ),
      );
      await prisma.userSession.update({
        where: { id: existing.id },
        data: { endedAt: existing.lastSeenAt, durationSec },
      });
    }
  }

  // 2) No usable existing session → create a fresh one. Client should store the new id.
  const created = await prisma.userSession.create({
    data: {
      userId: authUser.id,
      startedAt: now,
      lastSeenAt: now,
      userAgent,
      referer: body.referer ?? null,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, sessionId: created.id, created: true });
}
