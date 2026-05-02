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

type DailyRow = {
  date: string;
  signups: number;
  activated: number;
  activeUsers: number;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangeKey = searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeKey] ?? 30;

  const data = await getCachedJson(`cache:growth:${rangeKey}`, 5 * 60 * 1000, async () => {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const rows = await prisma.$queryRaw<
      Array<{
        d: Date;
        signups: bigint;
        activated: bigint;
        active_users: bigint;
      }>
    >`
      WITH days AS (
        SELECT generate_series(${since}::date, CURRENT_DATE, '1 day')::date AS d
      )
      SELECT
        days.d AS d,
        COALESCE(s.signups, 0)::bigint AS signups,
        COALESCE(a.activated, 0)::bigint AS activated,
        COALESCE(au.active_users, 0)::bigint AS active_users
      FROM days
      LEFT JOIN (
        SELECT DATE_TRUNC('day', created_at)::date AS d, COUNT(*)::bigint AS signups
        FROM users
        WHERE created_at >= ${since}
        GROUP BY DATE_TRUNC('day', created_at)::date
      ) s ON s.d = days.d
      LEFT JOIN (
        SELECT DATE_TRUNC('day', created_at)::date AS d, COUNT(DISTINCT user_id)::bigint AS activated
        FROM user_status_logs
        WHERE to_status = 'ACTIVE' AND created_at >= ${since}
        GROUP BY DATE_TRUNC('day', created_at)::date
      ) a ON a.d = days.d
      LEFT JOIN (
        SELECT DATE_TRUNC('day', last_seen_at)::date AS d, COUNT(DISTINCT user_id)::bigint AS active_users
        FROM user_sessions
        WHERE last_seen_at >= ${since}
        GROUP BY DATE_TRUNC('day', last_seen_at)::date
      ) au ON au.d = days.d
      ORDER BY days.d ASC;
    `;

    const daily: DailyRow[] = rows.map((r) => ({
      date: r.d.toISOString().slice(0, 10),
      signups: Number(r.signups),
      activated: Number(r.activated),
      activeUsers: Number(r.active_users),
    }));

    return { range: rangeKey, daily };
  });

  return NextResponse.json(data);
}
