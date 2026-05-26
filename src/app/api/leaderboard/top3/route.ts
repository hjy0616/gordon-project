import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { getCachedJson } from "@/lib/analytics-cache";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

type TopRow = { id: string; total: bigint };
type AdminIdRow = { id: string };

export type LeaderboardTop3Response = {
  topThree: { id: string; rank: 1 | 2 | 3 }[];
  adminIds: string[];
};

export async function GET() {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json(
      { topThree: [], adminIds: [] } satisfies LeaderboardTop3Response,
      { status: 401 },
    );
  }

  const payload = await getCachedJson<LeaderboardTop3Response>(
    "cache:leaderboard-top3:v1:30d",
    FIVE_MINUTES_MS,
    async () => {
      const since = new Date(Date.now() - THIRTY_DAYS_MS);

      const [topRows, adminRows] = await Promise.all([
        prisma.$queryRaw<TopRow[]>`
          WITH admin_ids AS (SELECT id FROM users WHERE role = 'ADMIN'),
            p  AS (SELECT author_id AS uid, COUNT(*)::bigint AS n FROM posts            WHERE created_at >= ${since} GROUP BY author_id),
            c  AS (SELECT author_id AS uid, COUNT(*)::bigint AS n FROM comments         WHERE created_at >= ${since} GROUP BY author_id),
            l  AS (SELECT user_id   AS uid, COUNT(*)::bigint AS n FROM post_likes       WHERE created_at >= ${since} GROUP BY user_id),
            s  AS (SELECT user_id   AS uid, COUNT(*)::bigint AS n FROM lasagna_simulations WHERE created_at >= ${since} GROUP BY user_id),
            m  AS (
              SELECT user_id AS uid, COUNT(*)::bigint AS n FROM (
                          SELECT user_id FROM country_notes     WHERE created_at >= ${since}
                UNION ALL SELECT user_id FROM country_edits     WHERE created_at >= ${since}
                UNION ALL SELECT user_id FROM capital_flows     WHERE created_at >= ${since}
                UNION ALL SELECT user_id FROM country_relations WHERE created_at >= ${since}
              ) x GROUP BY user_id
            ),
            tm AS (
              SELECT user_id AS uid, COUNT(*)::bigint AS n FROM (
                          SELECT user_id FROM custom_districts   WHERE created_at >= ${since}
                UNION ALL SELECT user_id FROM district_notes     WHERE created_at >= ${since}
                UNION ALL SELECT user_id FROM district_edits     WHERE created_at >= ${since}
                UNION ALL SELECT user_id FROM district_overrides WHERE created_at >= ${since}
              ) x GROUP BY user_id
            ),
            mm AS (SELECT user_id AS uid, COUNT(*)::bigint AS n FROM mind_maps WHERE created_at >= ${since} GROUP BY user_id)
          SELECT
            u.id,
            (COALESCE(p.n,0)+COALESCE(c.n,0)+COALESCE(l.n,0)+COALESCE(s.n,0)+COALESCE(m.n,0)+COALESCE(tm.n,0)+COALESCE(mm.n,0))::bigint AS total
          FROM users u
          LEFT JOIN p  ON p.uid  = u.id
          LEFT JOIN c  ON c.uid  = u.id
          LEFT JOIN l  ON l.uid  = u.id
          LEFT JOIN s  ON s.uid  = u.id
          LEFT JOIN m  ON m.uid  = u.id
          LEFT JOIN tm ON tm.uid = u.id
          LEFT JOIN mm ON mm.uid = u.id
          WHERE (COALESCE(p.n,0)+COALESCE(c.n,0)+COALESCE(l.n,0)+COALESCE(s.n,0)+COALESCE(m.n,0)+COALESCE(tm.n,0)+COALESCE(mm.n,0)) > 0
            AND u.role <> 'ADMIN'
            AND u.id NOT IN (SELECT id FROM admin_ids)
          ORDER BY total DESC, u.id ASC
          LIMIT 3;
        `,
        prisma.$queryRaw<AdminIdRow[]>`SELECT id FROM users WHERE role = 'ADMIN';`,
      ]);

      return {
        topThree: topRows.map((row, idx) => ({
          id: row.id,
          rank: (idx + 1) as 1 | 2 | 3,
        })),
        adminIds: adminRows.map((row) => row.id),
      };
    },
  );

  return NextResponse.json(payload);
}
