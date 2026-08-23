import { Icons } from "@floos/ui/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@floos/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import * as React from "react";

import { NavMain } from "@/components/nav-main";

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: Icons.dashboard,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: Icons.chartHistogram,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: Icons.transactionDollar,
      items: [
        {
          title: "All Transactions",
          url: "/transactions",
        },
        {
          title: "Categories",
          url: "/transactions/categories",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Icons.settings,
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "Bank Connections",
          url: "/settings/bank-connections",
        },
        {
          title: "Members",
          url: "/settings/members",
        },
        {
          title: "Notifications",
          url: "/settings/notifications",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icons.floos />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Floos</span>
                <span className="truncate text-xs">Workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Account" render={<Link to="/account" />}>
              <Icons.settings />
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
