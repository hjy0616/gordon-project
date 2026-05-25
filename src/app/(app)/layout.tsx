import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeartbeatMount } from "@/components/heartbeat-mount";
import { MembershipSentinel } from "@/components/membership-sentinel";
import { QueryProvider } from "@/lib/providers/query-provider";
import { requireActiveUserOrRedirect } from "@/lib/auth-utils";
import { getSignedImageUrl } from "@/lib/s3";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireActiveUserOrRedirect();

  const avatarUrl = user.image ? await getSignedImageUrl(user.image) : null;

  return (
    <QueryProvider>
      <HeartbeatMount />
      <MembershipSentinel />
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
          <SidebarTrigger
            className="absolute left-2 top-3 z-30 size-7 rounded-md border border-border bg-background shadow-sm sm:left-0 sm:-translate-x-1/2"
          />
          <div className="flex-1 overflow-hidden p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
