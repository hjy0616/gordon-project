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
  total_sessions: bigint;
};

type HeatmapRow = {
  dow: number;
  hour: number;
  count: bigint;
};

// byPath는 Vercel Web Analytics(Top Pages)에 위임

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

    const [durationRows, heatmapRows] = await Promise.all([
      prisma.$queryRaw<DurationRow[]>`
        SELECT
          AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, last_seen_at) - started_at)))::float AS avg_sec,
          COUNT(*)::bigint AS total_sessions
        FROM user_sessions
        WHERE started_at >= ${since};
      `,
      prisma.$queryRaw<HeatmapRow[]>`
        SELECT
          EXTRACT(DOW FROM last_seen_at)::int AS dow,
          EXTRACT(HOUR FROM last_seen_at)::int AS hour,
          COUNT(*)::bigint AS count
        FROM user_sessions
        WHERE last_seen_at >= ${since}
        GROUP BY dow, hour
        ORDER BY dow, hour;
      `,
    ]);

    const durationRow = durationRows[0];
    const avgDurationSec = durationRow?.avg_sec
      ? Math.round(Number(durationRow.avg_sec))
      : 0;

    return {
      range: rangeKey,
      avgDurationSec,
      totalSessions: durationRow ? Number(durationRow.total_sessions) : 0,
      hourlyHeatmap: heatmapRows.map((r) => ({
        dow: r.dow,
        hour: r.hour,
        count: Number(r.count),
      })),
    };
  });

  return NextResponse.json(data);
}
