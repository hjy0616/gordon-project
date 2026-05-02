import { redirect } from "next/navigation";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeartbeatMount } from "@/components/heartbeat-mount";
import { QueryProvider } from "@/lib/providers/query-provider";
import { requireActiveUser } from "@/lib/auth-utils";
import { getSignedImageUrl } from "@/lib/s3";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireActiveUser();
  if (!user) {
    redirect("/login");
  }

  const avatarUrl = user.image ? await getSignedImageUrl(user.image) : null;

  return (
    <QueryProvider>
      <HeartbeatMount />
      <SidebarProvider>
        <AppSidebar
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          avatarUrl={avatarUrl}
        />
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 overflow-hidden p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
