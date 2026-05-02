import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import { getCachedJson } from "@/lib/analytics-cache";
import {
  countActionActiveUsersSince,
  getActionActiveUserIdsSince,
} from "@/lib/analytics/queries/action-active-users";

export const runtime = "nodejs";

// 6개 카테고리:
//   post / comment / like / simulation: 단일 모델
//   macro_map:    country_notes + country_edits + capital_flows + country_relations
//   treasure_map: custom_districts + district_notes + district_edits + district_overrides
// 모두 created_at 기준 (저장한 순간).

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

type TimelineRow = {
  day: Date;
  type: string;
  count: bigint;
};

type TopAuthorRow = {
  id: string;
  name: string | null;
  email: string;
  posts: bigint;
  comments: bigint;
  likes: bigint;
  sims: bigint;
  macro: bigint;
  treasure: bigint;
  total: bigint;
};

type BoardActivityRow = {
  slug: string;
  name: string;
  posts: bigint;
};

type CategoryTotalRow = {
  posts: bigint;
  comments: bigint;
  likes: bigint;
  sims: bigint;
  macro: bigint;
  treasure: bigint;
};

type DistributionRow = {
  inactive: bigint;
  light: bigint;
  medium: bigint;
  heavy: bigint;
};

type TodayRow = {
  posts_today: bigint;
  comments_today: bigint;
  likes_today: bigint;
  sims_today: bigint;
  macro_today: bigint;
  treasure_today: bigint;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangeKey = searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const cacheKey = `cache:user-activity:${rangeKey}`;

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const day1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      dauUserIds,
      wauCount,
      mauCount,
      contribCount,
      timelineRows,
      topAuthorRows,
      boardRows,
      categoryTotalRows,
      distRows,
      todayRows,
    ] = await Promise.all([
      // DAU 유저 ID 리스트 (신규/재방문 분리에 사용)
      getActionActiveUserIdsSince(day1),
      countActionActiveUsersSince(day7),
      countActionActiveUsersSince(day30),
      // Active Contributor (range 내 활동) — 12개 모델 헬퍼 사용
      countActionActiveUsersSince(since),
      prisma.$queryRaw<TimelineRow[]>`
        SELECT DATE(created_at) AS day, 'post'::text AS type, COUNT(*)::bigint AS count
        FROM posts WHERE created_at >= ${since} GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at), 'comment'::text, COUNT(*)::bigint
        FROM comments WHERE created_at >= ${since} GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at), 'like'::text, COUNT(*)::bigint
        FROM post_likes WHERE created_at >= ${since} GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at), 'simulation'::text, COUNT(*)::bigint
        FROM lasagna_simulations WHERE created_at >= ${since} GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at) AS day, 'macro_map'::text AS type, COUNT(*)::bigint
        FROM (
          SELECT created_at FROM country_notes WHERE created_at >= ${since}
          UNION ALL SELECT created_at FROM country_edits WHERE created_at >= ${since}
          UNION ALL SELECT created_at FROM capital_flows WHERE created_at >= ${since}
          UNION ALL SELECT created_at FROM country_relations WHERE created_at >= ${since}
        ) m GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at) AS day, 'treasure_map'::text AS type, COUNT(*)::bigint
        FROM (
          SELECT created_at FROM custom_districts WHERE created_at >= ${since}
          UNION ALL SELECT created_at FROM district_notes WHERE created_at >= ${since}
          UNION ALL SELECT created_at FROM district_edits WHERE created_at >= ${since}
          UNION ALL SELECT created_at FROM district_overrides WHERE created_at >= ${since}
        ) tm GROUP BY DATE(created_at)
        ORDER BY day, type;
      `,
      prisma.$queryRaw<TopAuthorRow[]>`
        WITH
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
              SELECT user_id FROM custom_districts  WHERE created_at >= ${since}
              UNION ALL SELECT user_id FROM district_notes     WHERE created_at >= ${since}
              UNION ALL SELECT user_id FROM district_edits     WHERE created_at >= ${since}
              UNION ALL SELECT user_id FROM district_overrides WHERE created_at >= ${since}
            ) x GROUP BY user_id
          )
        SELECT
          u.id, u.name, u.email,
          COALESCE(p.n, 0)::bigint  AS posts,
          COALESCE(c.n, 0)::bigint  AS comments,
          COALESCE(l.n, 0)::bigint  AS likes,
          COALESCE(s.n, 0)::bigint  AS sims,
          COALESCE(m.n, 0)::bigint  AS macro,
          COALESCE(tm.n, 0)::bigint AS treasure,
          (COALESCE(p.n,0)+COALESCE(c.n,0)+COALESCE(l.n,0)+COALESCE(s.n,0)+COALESCE(m.n,0)+COALESCE(tm.n,0))::bigint AS total
        FROM users u
        LEFT JOIN p  ON p.uid  = u.id
        LEFT JOIN c  ON c.uid  = u.id
        LEFT JOIN l  ON l.uid  = u.id
        LEFT JOIN s  ON s.uid  = u.id
        LEFT JOIN m  ON m.uid  = u.id
        LEFT JOIN tm ON tm.uid = u.id
        WHERE (COALESCE(p.n,0)+COALESCE(c.n,0)+COALESCE(l.n,0)+COALESCE(s.n,0)+COALESCE(m.n,0)+COALESCE(tm.n,0)) > 0
        ORDER BY total DESC
        LIMIT 10;
      `,
      prisma.$queryRaw<BoardActivityRow[]>`
        SELECT b.slug, b.name, COUNT(p.id)::bigint AS posts
        FROM boards b
        LEFT JOIN posts p ON p.board_id = b.id AND p.created_at >= ${since}
        GROUP BY b.id, b.slug, b.name
        ORDER BY posts DESC, b.sort_order ASC;
      `,
      prisma.$queryRaw<CategoryTotalRow[]>`
        SELECT
          (SELECT COUNT(*) FROM posts            WHERE created_at >= ${since})::bigint AS posts,
          (SELECT COUNT(*) FROM comments         WHERE created_at >= ${since})::bigint AS comments,
          (SELECT COUNT(*) FROM post_likes       WHERE created_at >= ${since})::bigint AS likes,
          (SELECT COUNT(*) FROM lasagna_simulations WHERE created_at >= ${since})::bigint AS sims,
          (
            (SELECT COUNT(*) FROM country_notes     WHERE created_at >= ${since}) +
            (SELECT COUNT(*) FROM country_edits     WHERE created_at >= ${since}) +
            (SELECT COUNT(*) FROM capital_flows     WHERE created_at >= ${since}) +
            (SELECT COUNT(*) FROM country_relations WHERE created_at >= ${since})
          )::bigint AS macro,
          (
            (SELECT COUNT(*) FROM custom_districts  WHERE created_at >= ${since}) +
            (SELECT COUNT(*) FROM district_notes    WHERE created_at >= ${since}) +
            (SELECT COUNT(*) FROM district_edits    WHERE created_at >= ${since}) +
            (SELECT COUNT(*) FROM district_overrides WHERE created_at >= ${since})
          )::bigint AS treasure;
      `,
      prisma.$queryRaw<DistributionRow[]>`
        WITH all_actions AS (
          SELECT author_id AS uid FROM posts             WHERE created_at >= ${since}
          UNION ALL SELECT author_id FROM comments       WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM post_likes     WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM lasagna_simulations WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM country_notes     WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM country_edits     WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM capital_flows     WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM country_relations WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM custom_districts  WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM district_notes    WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM district_edits    WHERE created_at >= ${since}
          UNION ALL SELECT user_id   FROM district_overrides WHERE created_at >= ${since}
        ),
        user_totals AS (
          SELECT u.id, COALESCE(a.n, 0) AS total
          FROM users u
          LEFT JOIN (SELECT uid, COUNT(*)::int AS n FROM all_actions GROUP BY uid) a
            ON a.uid = u.id
        )
        SELECT
          COUNT(*) FILTER (WHERE total = 0)::bigint               AS inactive,
          COUNT(*) FILTER (WHERE total BETWEEN 1 AND 4)::bigint    AS light,
          COUNT(*) FILTER (WHERE total BETWEEN 5 AND 19)::bigint   AS medium,
          COUNT(*) FILTER (WHERE total >= 20)::bigint              AS heavy
        FROM user_totals;
      `,
      prisma.$queryRaw<TodayRow[]>`
        SELECT
          (SELECT COUNT(*) FROM posts            WHERE created_at >= CURRENT_DATE)::bigint AS posts_today,
          (SELECT COUNT(*) FROM comments         WHERE created_at >= CURRENT_DATE)::bigint AS comments_today,
          (SELECT COUNT(*) FROM post_likes       WHERE created_at >= CURRENT_DATE)::bigint AS likes_today,
          (SELECT COUNT(*) FROM lasagna_simulations WHERE created_at >= CURRENT_DATE)::bigint AS sims_today,
          (
            (SELECT COUNT(*) FROM country_notes     WHERE created_at >= CURRENT_DATE) +
            (SELECT COUNT(*) FROM country_edits     WHERE created_at >= CURRENT_DATE) +
            (SELECT COUNT(*) FROM capital_flows     WHERE created_at >= CURRENT_DATE) +
            (SELECT COUNT(*) FROM country_relations WHERE created_at >= CURRENT_DATE)
          )::bigint AS macro_today,
          (
            (SELECT COUNT(*) FROM custom_districts  WHERE created_at >= CURRENT_DATE) +
            (SELECT COUNT(*) FROM district_notes    WHERE created_at >= CURRENT_DATE) +
            (SELECT COUNT(*) FROM district_edits    WHERE created_at >= CURRENT_DATE) +
            (SELECT COUNT(*) FROM district_overrides WHERE created_at >= CURRENT_DATE)
          )::bigint AS treasure_today;
      `,
    ]);

    const dau = dauUserIds.length;

    // 신규/재방문 분리: DAU 유저 중 가입일이 오늘 이후인 distinct user
    const dauNew =
      dau > 0
        ? await prisma.user.count({
            where: {
              id: { in: dauUserIds },
              createdAt: { gte: todayStart },
            },
          })
        : 0;
    const dauReturning = Math.max(0, dau - dauNew);

    const today = todayRows[0];
    const dist = distRows[0];
    const cat = categoryTotalRows[0];

    return {
      range: rangeKey,
      activeUsers: { dau, wau: wauCount, mau: mauCount },
      dauNew,
      dauReturning,
      activeContributors: contribCount,
      today: {
        posts: Number(today?.posts_today ?? 0),
        comments: Number(today?.comments_today ?? 0),
        likes: Number(today?.likes_today ?? 0),
        simulations: Number(today?.sims_today ?? 0),
        macroMap: Number(today?.macro_today ?? 0),
        treasureMap: Number(today?.treasure_today ?? 0),
      },
      categoryTotals: {
        posts: Number(cat?.posts ?? 0),
        comments: Number(cat?.comments ?? 0),
        likes: Number(cat?.likes ?? 0),
        simulations: Number(cat?.sims ?? 0),
        macroMap: Number(cat?.macro ?? 0),
        treasureMap: Number(cat?.treasure ?? 0),
      },
      timeline: timelineRows.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        type: r.type,
        count: Number(r.count),
      })),
      topAuthors: topAuthorRows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        posts: Number(r.posts),
        comments: Number(r.comments),
        likes: Number(r.likes),
        simulations: Number(r.sims),
        macroMap: Number(r.macro),
        treasureMap: Number(r.treasure),
        total: Number(r.total),
      })),
      byBoard: boardRows.map((r) => ({
        slug: r.slug,
        name: r.name,
        posts: Number(r.posts),
      })),
      distribution: {
        inactive: Number(dist?.inactive ?? 0),
        light: Number(dist?.light ?? 0),
        medium: Number(dist?.medium ?? 0),
        heavy: Number(dist?.heavy ?? 0),
      },
    };
  });

  return NextResponse.json(data);
}
