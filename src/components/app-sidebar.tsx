"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  ChevronRight,
  ChevronsUpDown,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  MessageSquare,
  Moon,
  Shield,
  Sun,
  UserCog,
} from "lucide-react";
import { useBoards } from "@/lib/queries/use-boards";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarRenewalStatus } from "@/components/sidebar-renewal-status";

const mapSubItems = [
  { title: "Macro Map", href: "/map/macro-map", icon: Globe },
  { title: "Secret Treasure Map", href: "/map/secret-treasure-map", icon: MapPin },
];

type NavUserData = {
  name: string | null;
  email: string;
  role: string;
};

function NavUser({
  user,
  avatarUrl,
}: {
  user: NavUserData;
  avatarUrl: string | null;
}) {
  const { theme, setTheme } = useTheme();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "?";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" />}
          >
            <Avatar className="size-8 rounded-lg">
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl}
                  alt={user.name ?? user.email}
                  className="rounded-lg"
                />
              ) : null}
              <AvatarFallback className="rounded-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user.name || "사용자"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
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
            <DropdownMenuItem render={<Link href="/account" />}>
              <UserCog className="mr-2 size-4" />
              개인정보 수정
            </DropdownMenuItem>
            {user.role === "ADMIN" && (
              <DropdownMenuItem render={<Link href="/admin" />}>
                <Shield className="mr-2 size-4" />
                Admin
              </DropdownMenuItem>
            )}
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

export function AppSidebar({
  user,
  avatarUrl,
}: {
  user: NavUserData;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const isMapActive = pathname.startsWith("/map");
  const isBoardActive = pathname.startsWith("/board");
  const [mapOpen, setMapOpen] = useState(isMapActive);
  const [boardOpen, setBoardOpen] = useState(isBoardActive);
  const { data: boardsData } = useBoards();
  const boards = boardsData?.boards ?? [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:pt-3">
        <Link href="/dashboard" className="flex items-center">
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
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                  render={<Link href="/dashboard" />}
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible open={mapOpen} onOpenChange={setMapOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton isActive={isMapActive} tooltip="Map" />
                    }
                  >
                    <Map />
                    <span>Map</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 [[data-panel-open]_&]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {mapSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            isActive={pathname === item.href}
                            render={<Link href={item.href} />}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/lasagna"}
                  tooltip="Lasagna"
                  render={<Link href="/lasagna" />}
                >
                  <Layers />
                  <span>Lasagna</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                open={boardOpen}
                onOpenChange={setBoardOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton isActive={isBoardActive} tooltip="게시판" />
                    }
                  >
                    <MessageSquare />
                    <span>게시판</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 [[data-panel-open]_&]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {boards.length === 0 ? (
                        <SidebarMenuSubItem>
                          <span className="px-2 py-1.5 text-xs text-muted-foreground">
                            등록된 게시판이 없습니다
                          </span>
                        </SidebarMenuSubItem>
                      ) : (
                        boards.map((board) => {
                          const href = `/board/${board.slug}`;
                          return (
                            <SidebarMenuSubItem key={board.id}>
                              <SidebarMenuSubButton
                                isActive={pathname.startsWith(href)}
                                render={<Link href={href} />}
                              >
                                <span>{board.name}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarRenewalStatus />
        <SidebarSeparator />
        <NavUser user={user} avatarUrl={avatarUrl} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
