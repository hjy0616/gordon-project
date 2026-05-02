import { prisma } from "@/lib/prisma";

export async function computeNewSignups30d(): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return prisma.user.count({
    where: { createdAt: { gte: since } },
  });
}
