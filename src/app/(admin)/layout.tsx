import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { QueryProvider } from "@/lib/providers/query-provider";
import { requireActiveAdminOrRedirect } from "@/lib/auth-utils";
import { isPortfolioAllowed } from "@/lib/finance-portfolio-access";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireActiveAdminOrRedirect();
  if (!admin) {
    redirect("/dashboard");
  }

  const showPortfolio = isPortfolioAllowed(admin.id);

  return (
    <QueryProvider>
      <SidebarProvider>
        <AdminSidebar showPortfolio={showPortfolio} />
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 overflow-hidden p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
