import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import { getCachedJson } from "@/lib/analytics-cache";

export const runtime = "nodejs";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

type DurationRow = {
  avg_sec: number | null;
  p50_sec: number | null;
  p90_sec: number | null;
  total_sessions: bigint;
};

// byPath / 시간대 heatmap은 Vercel Web Analytics에 위임

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangeKey = searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const cacheKey = `cache:engagement:${rangeKey}`;

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const durationRows = await prisma.$queryRaw<DurationRow[]>`
      SELECT
        AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, last_seen_at) - started_at)))::float AS avg_sec,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (COALESCE(ended_at, last_seen_at) - started_at)))::float AS p50_sec,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (COALESCE(ended_at, last_seen_at) - started_at)))::float AS p90_sec,
        COUNT(*)::bigint AS total_sessions
      FROM user_sessions
      WHERE started_at >= ${since};
    `;

    const durationRow = durationRows[0];
    const round = (v: number | null | undefined) =>
      v != null ? Math.round(Number(v)) : 0;

    return {
      range: rangeKey,
      avgDurationSec: round(durationRow?.avg_sec),
      p50DurationSec: round(durationRow?.p50_sec),
      p90DurationSec: round(durationRow?.p90_sec),
      totalSessions: durationRow ? Number(durationRow.total_sessions) : 0,
    };
  });

  return NextResponse.json(data);
}
