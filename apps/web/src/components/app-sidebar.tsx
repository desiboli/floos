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
  useSidebar,
} from "@floos/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { SpaceSwitcher } from "@/features/spaces/components/space-switcher";

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
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SpaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Collapse Sidebar" onClick={toggleSidebar}>
              <Icons.sidebar />
              <span>Collapse Sidebar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
