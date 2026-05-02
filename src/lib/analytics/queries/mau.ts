import { prisma } from "@/lib/prisma";

export async function computeMau(): Promise<number> {
  const day30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return prisma.user.count({
    where: { lastActiveAt: { gt: day30 }, role: "USER" },
  });
}

export async function computeDau(): Promise<number> {
  const day1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.user.count({
    where: { lastActiveAt: { gt: day1 }, role: "USER" },
  });
}

export async function computeWau(): Promise<number> {
  const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.user.count({
    where: { lastActiveAt: { gt: day7 }, role: "USER" },
  });
}

export async function computeStickiness(): Promise<number> {
  const [dau, mau] = await Promise.all([computeDau(), computeMau()]);
  return mau > 0 ? (dau / mau) * 100 : 0;
}
