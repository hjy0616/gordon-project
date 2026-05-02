import { prisma } from "@/lib/prisma";

type CohortRow = { size: bigint; d30: bigint };

export async function computeD30Retention(): Promise<number> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<CohortRow[]>`
    WITH cohort AS (
      SELECT
        id,
        DATE_TRUNC('day', created_at) AS cohort_date,
        last_active_at
      FROM users
      WHERE created_at >= ${since}
        AND created_at < NOW() - INTERVAL '30 days'
    )
    SELECT
      COUNT(*)::bigint AS size,
      COUNT(*) FILTER (WHERE last_active_at >= cohort_date + INTERVAL '30 days')::bigint AS d30
    FROM cohort
    GROUP BY cohort_date
    HAVING COUNT(*) > 0;
  `;

  if (rows.length === 0) return 0;

  let totalSize = 0;
  let totalRetained = 0;
  for (const r of rows) {
    totalSize += Number(r.size);
    totalRetained += Number(r.d30);
  }
  return totalSize > 0 ? (totalRetained / totalSize) * 100 : 0;
}
