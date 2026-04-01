"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Globe, LayoutDashboard, Map, MapPin } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ThemeToggle } from "@/components/theme-toggle";

const mapSubItems = [
  { title: "Macro Map", href: "/map/macro-map", icon: Globe },
  { title: "Secret Treasure Map", href: "/map/secret-treasure-map", icon: MapPin },
];

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
