import { prisma } from "@/lib/prisma";

export async function computeActiveMembers(): Promise<number> {
  return prisma.user.count({
    where: { status: "ACTIVE", role: "USER" },
  });
}
