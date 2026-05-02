import { prisma } from "@/lib/prisma";

type DurationRow = { avg_sec: number | null };

export async function computeAvgSessionMinutes30d(): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<DurationRow[]>`
    SELECT
      AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, last_seen_at) - started_at)))::float AS avg_sec
    FROM user_sessions
    WHERE started_at >= ${since};
  `;

  const avgSec = rows[0]?.avg_sec ?? 0;
  return avgSec ? Number(avgSec) / 60 : 0;
}
