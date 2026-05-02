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

type SourceRow = {
  source: string | null;
  signups: bigint;
  activated: bigint;
};

type CampaignRow = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  sessions: bigint;
  unique_users: bigint;
};

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rangeKey = searchParams.get("range") ?? "30d";
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const cacheKey = `cache:inflow:${rangeKey}`;

  const data = await getCachedJson(cacheKey, 5 * 60 * 1000, async () => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [sourceRows, campaignRows] = await Promise.all([
      prisma.$queryRaw<SourceRow[]>`
        SELECT
          COALESCE(signup_source, 'direct') AS source,
          COUNT(*)::bigint AS signups,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::bigint AS activated
        FROM users
        WHERE created_at >= ${since}
        GROUP BY COALESCE(signup_source, 'direct')
        ORDER BY signups DESC
        LIMIT 20;
      `,
      prisma.$queryRaw<CampaignRow[]>`
        SELECT
          utm_source, utm_medium, utm_campaign,
          COUNT(*)::bigint AS sessions,
          COUNT(DISTINCT user_id)::bigint AS unique_users
        FROM user_sessions
        WHERE started_at >= ${since}
          AND (utm_source IS NOT NULL OR utm_campaign IS NOT NULL)
        GROUP BY utm_source, utm_medium, utm_campaign
        ORDER BY sessions DESC
        LIMIT 20;
      `,
    ]);

    return {
      range: rangeKey,
      sources: sourceRows.map((r) => {
        const signups = Number(r.signups);
        const activated = Number(r.activated);
        return {
          source: r.source ?? "direct",
          signups,
          activated,
          activationRate: signups > 0 ? activated / signups : 0,
        };
      }),
      campaigns: campaignRows.map((r) => ({
        utmSource: r.utm_source ?? null,
        utmMedium: r.utm_medium ?? null,
        utmCampaign: r.utm_campaign ?? null,
        sessions: Number(r.sessions),
        uniqueUsers: Number(r.unique_users),
      })),
    };
  });

  return NextResponse.json(data);
}
