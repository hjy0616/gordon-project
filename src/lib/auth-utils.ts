import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export const getAuthUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
});

export async function getAdminUser() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export const requireActiveUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      activeUntil: true,
    },
  });

  if (!dbUser) return null;
  if (dbUser.status !== "ACTIVE") return null;
  if (
    dbUser.role !== "ADMIN" &&
    dbUser.activeUntil &&
    dbUser.activeUntil.getTime() < Date.now()
  ) {
    return null;
  }

  return {
    ...dbUser,
    activeUntil: dbUser.activeUntil?.toISOString() ?? null,
  };
});

export async function requireActiveUserOrRedirect() {
  const user = await requireActiveUser();
  if (user) return user;

  const session = await auth();
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { status: true },
    });
    if (dbUser?.status === "EXPIRED") redirect("/expired");
  }
  redirect("/login");
}

export async function requireActiveAdmin() {
  const user = await requireActiveUserOrRedirect();
  if (user.role !== "ADMIN") return null;
  return user;
}
