import { auth } from "./auth";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function getAdminUser() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}
