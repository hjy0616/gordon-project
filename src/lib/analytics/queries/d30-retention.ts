import { prisma } from "@/lib/prisma";

type CohortRow = { size: bigint; d30: bigint };

// 13개 도메인 모델 — action-active-users.ts와 동기화 유지.
// 코호트 사용자가 자기 cohort_date + 30 days 이후에 13개 모델 중 어디든 액션 row를
// 만들었으면 retained로 본다. heartbeat(last_active_at)는 탭만 켜놔도 갱신되므로
// 활동지표로 부적합 — 메모리 원칙(feedback_action_active_users.md)에 따라 액션 기반.
export async function computeD30Retention(): Promise<number> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<CohortRow[]>`
    WITH cohort AS (
      SELECT
        id AS user_id,
        DATE_TRUNC('day', created_at) AS cohort_date
      FROM users
      WHERE created_at >= ${since}
        AND created_at < NOW() - INTERVAL '30 days'
    ),
    all_actions AS (
      SELECT author_id AS user_id, updated_at AS action_at FROM posts
      UNION ALL SELECT author_id,    updated_at FROM comments
      UNION ALL SELECT user_id,      created_at FROM post_likes
      UNION ALL SELECT user_id,      updated_at FROM lasagna_simulations
      UNION ALL SELECT user_id,      updated_at FROM country_notes
      UNION ALL SELECT user_id,      updated_at FROM country_edits
      UNION ALL SELECT user_id,      updated_at FROM capital_flows
      UNION ALL SELECT user_id,      updated_at FROM country_relations
      UNION ALL SELECT user_id,      updated_at FROM custom_districts
      UNION ALL SELECT user_id,      updated_at FROM district_notes
      UNION ALL SELECT user_id,      updated_at FROM district_edits
      UNION ALL SELECT user_id,      updated_at FROM district_overrides
      UNION ALL SELECT user_id,      updated_at FROM mind_maps
    )
    SELECT
      COUNT(*)::bigint AS size,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM all_actions a
          WHERE a.user_id = c.user_id
            AND a.action_at >= c.cohort_date + INTERVAL '30 days'
        )
      )::bigint AS d30
    FROM cohort c
    GROUP BY c.cohort_date
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
