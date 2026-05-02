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

type ExpiringRow = {
  id: string;
  name: string | null;
  email: string;
  active_until: Date | null;
};

type ChurnSummaryRow = {
  denominator: bigint;
  churned: bigint;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangeKey = searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const cacheKey = `cache:churn:${rangeKey}`;

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 분모: 각 유저의 since 직전 최신 status가 ACTIVE인 유저 수
    // 분자: 그 중 현재 status가 ACTIVE가 아닌 유저 수
    const [summaryRows, expiringRows] = await Promise.all([
      prisma.$queryRaw<ChurnSummaryRow[]>`
        WITH status_at_start AS (
          SELECT DISTINCT ON (user_id)
            user_id,
            to_status
          FROM user_status_logs
          WHERE created_at < ${since}
          ORDER BY user_id, created_at DESC, id DESC
        ),
        active_at_start AS (
          SELECT user_id FROM status_at_start WHERE to_status = 'ACTIVE'
        )
        SELECT
          COUNT(*)::bigint AS denominator,
          COUNT(*) FILTER (WHERE u.status <> 'ACTIVE')::bigint AS churned
        FROM active_at_start a
        JOIN users u ON u.id = a.user_id;
      `,
      prisma.$queryRaw<ExpiringRow[]>`
        SELECT id, name, email, active_until
        FROM users
        WHERE status = 'ACTIVE'
          AND role = 'USER'
          AND active_until IS NOT NULL
          AND active_until BETWEEN NOW() AND NOW() + INTERVAL '14 days'
        ORDER BY active_until ASC
        LIMIT 20;
      `,
    ]);

    const summary = summaryRows[0];
    const totalAtRiskStart = summary ? Number(summary.denominator) : 0;
    const churnedCount = summary ? Number(summary.churned) : 0;
    const churnRate = totalAtRiskStart > 0 ? churnedCount / totalAtRiskStart : 0;

    return {
      range: rangeKey,
      churnRate,
      churnedCount,
      totalAtRiskStart,
      expiringSoon: expiringRows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        activeUntil: r.active_until?.toISOString() ?? null,
      })),
    };
  });

  return NextResponse.json(data);
}
