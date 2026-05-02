import { prisma } from "@/lib/prisma";

type ChurnSummaryRow = {
  denominator: bigint;
  churned: bigint;
};

export async function computeStatusChurnRate30d(): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<ChurnSummaryRow[]>`
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
  `;

  const summary = rows[0];
  if (!summary) return 0;
  const denom = Number(summary.denominator);
  const churned = Number(summary.churned);
  return denom > 0 ? (churned / denom) * 100 : 0;
}
