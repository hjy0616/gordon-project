import { prisma } from "@/lib/prisma";
import { getActionActiveUserIdsSince } from "./action-active-users";

// "활동" = 12개 도메인 모델 UNION (action-active-users.ts 참고).
// admin은 KPI에서 제외 — 일반 회원 활동만 카운트.

async function countActionActiveExcludingAdmin(since: Date): Promise<number> {
  const userIds = await getActionActiveUserIdsSince(since);
  if (userIds.length === 0) return 0;
  const adminCount = await prisma.user.count({
    where: { id: { in: userIds }, role: "ADMIN" },
  });
  return userIds.length - adminCount;
}

export async function computeMau(): Promise<number> {
  const day30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return countActionActiveExcludingAdmin(day30);
}

export async function computeDau(): Promise<number> {
  const day1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return countActionActiveExcludingAdmin(day1);
}

export async function computeWau(): Promise<number> {
  const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return countActionActiveExcludingAdmin(day7);
}

export async function computeStickiness(): Promise<number> {
  const [dau, mau] = await Promise.all([computeDau(), computeMau()]);
  return mau > 0 ? (dau / mau) * 100 : 0;
}
