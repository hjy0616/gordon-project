import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import { getCachedJson } from "@/lib/analytics-cache";

export const runtime = "nodejs";

// 잔존율(D1/D7/D30)은 13개 도메인 모델 UNION의 action_at으로 판정한다.
// 메모리 원칙(feedback_action_active_users): heartbeat의 last_active_at은 탭만 켜놔도
// 갱신되므로 활동지표로 부적합. all_actions CTE는 d30-retention.ts와 동기화 유지.
//
// 활성화 funnel(7일 내 첫 액션) — 5개 카테고리:
//   first_post · first_lasagna · first_mind · first_macro · first_treasure
// macro/treasure는 4개 하위 모델을 UNION 후 MIN(created_at)을 first_at으로 사용.

type CohortRow = {
  cohort_date: Date;
  size: bigint;
  d1: bigint;
  d7: bigint;
  d30: bigint;
  first_post_7d: bigint;
  first_lasagna_7d: bigint;
  first_mind_7d: bigint;
  first_macro_7d: bigint;
  first_treasure_7d: bigint;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "weekly" ? "weekly" : "daily";
  const cacheKey = `cache:cohorts:v2:${type}`;

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const truncUnit = type === "weekly" ? "week" : "day";
    const lookbackDays = type === "weekly" ? 84 : 30;
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const rows = await prisma.$queryRawUnsafe<CohortRow[]>(
      `
      WITH cohort AS (
        SELECT
          id AS user_id,
          DATE_TRUNC('${truncUnit}', created_at) AS cohort_date
        FROM users
        WHERE created_at >= $1
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
      ),
      first_post AS (
        SELECT author_id AS user_id, MIN(created_at) AS first_at FROM posts GROUP BY author_id
      ),
      first_lasagna AS (
        SELECT user_id, MIN(created_at) AS first_at FROM lasagna_simulations GROUP BY user_id
      ),
      first_mind AS (
        SELECT user_id, MIN(created_at) AS first_at FROM mind_maps GROUP BY user_id
      ),
      first_macro AS (
        SELECT user_id, MIN(created_at) AS first_at FROM (
          SELECT user_id, created_at FROM country_notes
          UNION ALL SELECT user_id, created_at FROM country_edits
          UNION ALL SELECT user_id, created_at FROM capital_flows
          UNION ALL SELECT user_id, created_at FROM country_relations
        ) m GROUP BY user_id
      ),
      first_treasure AS (
        SELECT user_id, MIN(created_at) AS first_at FROM (
          SELECT user_id, created_at FROM custom_districts
          UNION ALL SELECT user_id, created_at FROM district_notes
          UNION ALL SELECT user_id, created_at FROM district_edits
          UNION ALL SELECT user_id, created_at FROM district_overrides
        ) t GROUP BY user_id
      )
      SELECT
        c.cohort_date,
        COUNT(*)::bigint AS size,
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM all_actions a
          WHERE a.user_id = c.user_id AND a.action_at >= c.cohort_date + INTERVAL '1 day'
        ))::bigint AS d1,
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM all_actions a
          WHERE a.user_id = c.user_id AND a.action_at >= c.cohort_date + INTERVAL '7 days'
        ))::bigint AS d7,
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM all_actions a
          WHERE a.user_id = c.user_id AND a.action_at >= c.cohort_date + INTERVAL '30 days'
        ))::bigint AS d30,
        COUNT(*) FILTER (WHERE fp.first_at    IS NOT NULL AND fp.first_at    < c.cohort_date + INTERVAL '7 days')::bigint AS first_post_7d,
        COUNT(*) FILTER (WHERE fl.first_at    IS NOT NULL AND fl.first_at    < c.cohort_date + INTERVAL '7 days')::bigint AS first_lasagna_7d,
        COUNT(*) FILTER (WHERE fmind.first_at IS NOT NULL AND fmind.first_at < c.cohort_date + INTERVAL '7 days')::bigint AS first_mind_7d,
        COUNT(*) FILTER (WHERE fma.first_at   IS NOT NULL AND fma.first_at   < c.cohort_date + INTERVAL '7 days')::bigint AS first_macro_7d,
        COUNT(*) FILTER (WHERE ftr.first_at   IS NOT NULL AND ftr.first_at   < c.cohort_date + INTERVAL '7 days')::bigint AS first_treasure_7d
      FROM cohort c
      LEFT JOIN first_post     fp    ON fp.user_id    = c.user_id
      LEFT JOIN first_lasagna  fl    ON fl.user_id    = c.user_id
      LEFT JOIN first_mind     fmind ON fmind.user_id = c.user_id
      LEFT JOIN first_macro    fma   ON fma.user_id   = c.user_id
      LEFT JOIN first_treasure ftr   ON ftr.user_id   = c.user_id
      GROUP BY c.cohort_date
      ORDER BY c.cohort_date DESC
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
        activation: {
          firstPost7d: size > 0 ? Number(r.first_post_7d) / size : 0,
          firstLasagna7d: size > 0 ? Number(r.first_lasagna_7d) / size : 0,
          firstMind7d: size > 0 ? Number(r.first_mind_7d) / size : 0,
          firstMacro7d: size > 0 ? Number(r.first_macro_7d) / size : 0,
          firstTreasure7d: size > 0 ? Number(r.first_treasure_7d) / size : 0,
        },
        activationCount: {
          firstPost7d: Number(r.first_post_7d),
          firstLasagna7d: Number(r.first_lasagna_7d),
          firstMind7d: Number(r.first_mind_7d),
          firstMacro7d: Number(r.first_macro_7d),
          firstTreasure7d: Number(r.first_treasure_7d),
        },
      };
    });

    return { type, cohorts };
  });

  return NextResponse.json(data);
}
