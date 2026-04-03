"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
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
  Moon,
  Sun,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/sidebar";

const mapSubItems = [
  { title: "Macro Map", href: "/map/macro-map", icon: Globe },
  { title: "Secret Treasure Map", href: "/map/secret-treasure-map", icon: MapPin },
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

export function AppSidebar() {
  const pathname = usePathname();
  const isMapActive = pathname.startsWith("/map");
  const [mapOpen, setMapOpen] = useState(isMapActive);

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
                  <span>Lasagna <span className="text-[10px] text-muted-foreground">(beta)</span></span>
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
