import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import { getCachedJson } from "@/lib/analytics-cache";

export const runtime = "nodejs";

type CohortRow = {
  cohort_date: Date;
  size: bigint;
  d1: bigint;
  d7: bigint;
  d30: bigint;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "weekly" ? "weekly" : "daily";
  const cacheKey = `cache:cohorts:${type}`;

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const truncUnit = type === "weekly" ? "week" : "day";
    const lookbackDays = type === "weekly" ? 84 : 30;
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const rows = await prisma.$queryRawUnsafe<CohortRow[]>(
      `
      WITH cohort AS (
        SELECT
          id,
          DATE_TRUNC('${truncUnit}', created_at) AS cohort_date,
          last_active_at,
          created_at
        FROM users
        WHERE created_at >= $1
      )
      SELECT
        cohort_date,
        COUNT(*)::bigint AS size,
        COUNT(*) FILTER (WHERE last_active_at >= cohort_date + INTERVAL '1 day')::bigint AS d1,
        COUNT(*) FILTER (WHERE last_active_at >= cohort_date + INTERVAL '7 days')::bigint AS d7,
        COUNT(*) FILTER (WHERE last_active_at >= cohort_date + INTERVAL '30 days')::bigint AS d30
      FROM cohort
      GROUP BY cohort_date
      ORDER BY cohort_date DESC
      LIMIT 30;
      `,
      since,
    );

    const cohorts = rows.map((r) => {
      const size = Number(r.size);
      return {
        cohortDate: r.cohort_date.toISOString().slice(0, 10),
        size,
        retention: {
          d1: size > 0 ? Number(r.d1) / size : 0,
          d7: size > 0 ? Number(r.d7) / size : 0,
          d30: size > 0 ? Number(r.d30) / size : 0,
        },
        retainedCount: {
          d1: Number(r.d1),
          d7: Number(r.d7),
          d30: Number(r.d30),
        },
      };
    });

    return { type, cohorts };
  });

  return NextResponse.json(data);
}
