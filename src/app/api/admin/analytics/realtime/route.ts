import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";

export const runtime = "nodejs";

// realtime 카드는 15초마다 polling되므로 가벼운 쿼리만 둔다.
// DAU/WAU/MAU(12-table UNION)는 user-activity 섹션(5분 캐시)에서만 노출.

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const min5 = new Date(now.getTime() - 5 * 60 * 1000);
  const min30 = new Date(now.getTime() - 30 * 60 * 1000);

  const [active5m, active30m, newSignupsToday, totalUsers, activatedUsers] =
    await Promise.all([
      prisma.userSession.findMany({
        where: { lastSeenAt: { gt: min5 } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.userSession.findMany({
        where: { lastSeenAt: { gt: min30 } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.user.count(),
      prisma.user.count({
        where: { status: "ACTIVE" },
      }),
    ]);

  const activationRate = totalUsers > 0 ? activatedUsers / totalUsers : 0;

  return NextResponse.json({
    active5m: active5m.length,
    active30m: active30m.length,
    newSignupsToday,
    activationRate,
    totalUsers,
    activatedUsers,
  });
}
