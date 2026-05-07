import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpiredRenewalForm } from "@/components/expired/expired-renewal-form";

export const dynamic = "force-dynamic";

export default async function ExpiredPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      activeUntil: true,
      renewalImage: true,
      renewalSubmittedAt: true,
      renewalRejectionReason: true,
      renewalRejectedAt: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const formattedActiveUntil = dbUser.activeUntil
    ? new Date(dbUser.activeUntil).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-orange-500">
          <AlertTriangle className="size-5" />
          <CardTitle className="text-xl font-bold tracking-tight">
            이용 기간이 만료되었습니다
          </CardTitle>
        </div>
        <CardDescription>
          {formattedActiveUntil
            ? `${formattedActiveUntil} 만료 — 재인증 이미지를 제출하면 관리자 검토 후 이용을 재개할 수 있습니다.`
            : "재인증 이미지를 제출하면 관리자 검토 후 이용을 재개할 수 있습니다."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ExpiredRenewalForm
          initialStatus={{
            hasSubmitted: !!dbUser.renewalImage,
            submittedAt: dbUser.renewalSubmittedAt
              ? dbUser.renewalSubmittedAt.toISOString()
              : null,
            rejectionReason: dbUser.renewalRejectionReason,
            rejectedAt: dbUser.renewalRejectedAt
              ? dbUser.renewalRejectedAt.toISOString()
              : null,
          }}
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          로그인 사용자: {dbUser.name || dbUser.email}
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="w-full"
        >
          <Button type="submit" variant="outline" className="w-full">
            로그아웃
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
