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

type LabelRow = {
  label: string | null;
  count: bigint;
};

type TimelineRow = {
  d: Date;
  count: bigint;
};

type ByTypeRow = {
  type: string;
  count: bigint;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangeKey = searchParams.get("range") ?? "30d";
  const filterType = searchParams.get("type") ?? "wow";
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const cacheKey = `cache:events:${filterType}:${rangeKey}`;

  if (filterType !== "wow" && filterType !== "pain") {
    return NextResponse.json({ error: "type must be wow or pain" }, { status: 400 });
  }

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [labelRows, timelineRows, byTypeRows, activeUsers] = await Promise.all([
      prisma.$queryRaw<LabelRow[]>`
        SELECT
          label,
          COUNT(*)::bigint AS count
        FROM user_events
        WHERE type = ${filterType}
          AND created_at >= ${since}
        GROUP BY label
        ORDER BY count DESC
        LIMIT 20;
      `,
      prisma.$queryRaw<TimelineRow[]>`
        SELECT
          DATE_TRUNC('day', created_at)::date AS d,
          COUNT(*)::bigint AS count
        FROM user_events
        WHERE type = ${filterType}
          AND created_at >= ${since}
        GROUP BY DATE_TRUNC('day', created_at)::date
        ORDER BY d ASC;
      `,
      prisma.$queryRaw<ByTypeRow[]>`
        SELECT
          type,
          COUNT(*)::bigint AS count
        FROM user_events
        WHERE created_at >= ${since}
        GROUP BY type
        ORDER BY count DESC
        LIMIT 15;
      `,
      prisma.user.count({
        where: {
          lastActiveAt: { gt: since },
        },
      }),
    ]);

    return {
      type: filterType,
      range: rangeKey,
      events: labelRows.map((r) => {
        const count = Number(r.count);
        return {
          label: r.label ?? "(unlabeled)",
          count,
          ratePerActiveUser: activeUsers > 0 ? count / activeUsers : 0,
        };
      }),
      timeline: timelineRows.map((r) => ({
        date: r.d.toISOString().slice(0, 10),
        count: Number(r.count),
      })),
      byType: byTypeRows.map((r) => ({
        type: r.type,
        count: Number(r.count),
      })),
    };
  });

  return NextResponse.json(data);
}
