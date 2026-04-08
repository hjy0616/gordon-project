"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  ChevronsUpDown,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  UserCheck,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface AdminCounts {
  pending: number;
  renewal: number;
}

const navItems = [
  { title: "대시보드", href: "/admin", icon: LayoutDashboard, badgeKey: null },
  {
    title: "승인 대기",
    href: "/admin/approvals",
    icon: UserCheck,
    badgeKey: "pending" as const,
  },
  {
    title: "재인증",
    href: "/admin/renewals",
    icon: FileCheck,
    badgeKey: "renewal" as const,
  },
  { title: "사용자 관리", href: "/admin/users", icon: Users, badgeKey: null },
];

function NavUser() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" />}
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.name || "사용자"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email || ""}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
          >
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 size-4" />
              ) : (
                <Moon className="mr-2 size-4" />
              )}
              {theme === "dark" ? "라이트 모드" : "다크 모드"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 size-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<AdminCounts>({ pending: 0, renewal: 0 });

  useEffect(() => {
    let active = true;

    const doFetch = () =>
      fetch("/api/admin/counts")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data) setCounts(data);
        });

    doFetch();
    const interval = setInterval(doFetch, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:pt-3">
        <Link href="/admin" className="flex flex-col items-start gap-1">
          <Image
            src="/logo.svg"
            alt="GORDON"
            width={135}
            height={27}
            className="group-data-[collapsible=icon]:hidden"
            priority
          />
          <Image
            src="/logogram.svg"
            alt="GORDON"
            width={44}
            height={26}
            className="hidden group-data-[collapsible=icon]:block"
            priority
          />
          <span className="text-xs font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
            Admin
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const badgeCount =
                  item.badgeKey ? counts[item.badgeKey] : 0;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.href)
                      }
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {badgeCount > 0 && (
                      <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="앱으로 돌아가기"
                  render={<Link href="/dashboard" />}
                >
                  <ArrowLeft />
                  <span>앱으로 돌아가기</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
