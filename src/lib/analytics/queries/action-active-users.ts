import { prisma } from "@/lib/prisma";

// "활동(action) 기반" 활성 유저 정의:
// 사용자가 페이지에서 무언가를 저장/생성/수정한 row가 있으면 그 시점에 활동한 것으로 본다.
// heartbeat(lastActiveAt)는 탭만 켜놔도 갱신되어 활동지표로 부적합.
// User 본인 모델은 제외 — updatedAt이 시스템 update(lastActiveAt 등)로도 갱신될 수 있음.
//
// 12개 도메인 모델 UNION:
//   Board:        posts, comments, post_likes
//   Lasagna:      lasagna_simulations
//   Macro Map:    country_notes, country_edits, capital_flows, country_relations
//   Treasure Map: custom_districts, district_notes, district_edits, district_overrides

type CountRow = { count: bigint };

/**
 * since 이후 `의미 있는 액션`(=row 생성/수정)을 한 distinct user 수.
 * createdAt 또는 updatedAt 중 하나라도 since 이후면 카운트 (post_likes는 createdAt만 존재).
 */
export async function countActionActiveUsersSince(since: Date): Promise<number> {
  const rows = await prisma.$queryRaw<CountRow[]>`
    WITH action_users AS (
      SELECT author_id    AS user_id FROM posts             WHERE updated_at > ${since}
      UNION
      SELECT author_id              FROM comments          WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM post_likes        WHERE created_at > ${since}
      UNION
      SELECT user_id                FROM lasagna_simulations WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM country_notes     WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM country_edits     WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM capital_flows     WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM country_relations WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM custom_districts  WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM district_notes    WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM district_edits    WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM district_overrides WHERE updated_at > ${since}
    )
    SELECT COUNT(DISTINCT user_id)::bigint AS count FROM action_users;
  `;
  return Number(rows[0]?.count ?? 0);
}

/**
 * since 이후 액션한 distinct userId 집합. WAU/MAU 분모, 신규 분리 등에 사용.
 */
export async function getActionActiveUserIdsSince(since: Date): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ user_id: string }[]>`
    SELECT DISTINCT user_id FROM (
      SELECT author_id    AS user_id FROM posts             WHERE updated_at > ${since}
      UNION
      SELECT author_id              FROM comments          WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM post_likes        WHERE created_at > ${since}
      UNION
      SELECT user_id                FROM lasagna_simulations WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM country_notes     WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM country_edits     WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM capital_flows     WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM country_relations WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM custom_districts  WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM district_notes    WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM district_edits    WHERE updated_at > ${since}
      UNION
      SELECT user_id                FROM district_overrides WHERE updated_at > ${since}
    ) t;
  `;
  return rows.map((r) => r.user_id);
}
