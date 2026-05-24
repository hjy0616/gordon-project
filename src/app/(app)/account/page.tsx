import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth-utils";
import { getSignedImageUrl } from "@/lib/s3";
import { AccountForm } from "@/components/account/account-form";
import { PasswordChangeCard } from "@/components/account/password-change-card";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireActiveUser();
  if (!user) {
    redirect("/login");
  }

  const avatarUrl = user.image ? await getSignedImageUrl(user.image) : null;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <header>
        <h1 className="text-2xl font-semibold">개인정보 수정</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          계정 정보를 확인하고 이름·프로필 이미지·비밀번호를 변경할 수 있습니다.
        </p>
      </header>
      <AccountForm
        initialName={user.name ?? ""}
        email={user.email}
        initialAvatarUrl={avatarUrl}
      />
      <PasswordChangeCard email={user.email} />
    </div>
  );
}
