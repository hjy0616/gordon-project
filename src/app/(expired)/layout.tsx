import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipSentinel } from "@/components/membership-sentinel";
import { QueryProvider } from "@/lib/providers/query-provider";

export default async function ExpiredLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (!dbUser) {
    redirect("/login");
  }

  if (dbUser.status === "ACTIVE") {
    redirect("/dashboard");
  }

  if (dbUser.status !== "EXPIRED") {
    // PENDING / SUSPENDED — self-service 대상 아님. signOut 후 로그인으로.
    await signOut({ redirect: false });
    redirect("/login");
  }

  return (
    <QueryProvider>
      <MembershipSentinel />
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        {children}
      </div>
    </QueryProvider>
  );
}
