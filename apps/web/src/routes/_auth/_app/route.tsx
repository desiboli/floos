import { SidebarProvider, SidebarInset } from "@floos/ui/components/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { spacesQueryOptions } from "@/features/spaces/services/queries";

export const Route = createFileRoute("/_auth/_app")({
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    const { spaces } = await context.queryClient.ensureQueryData(spacesQueryOptions());

    if (spaces.length === 0) {
      throw redirect({
        to: "/onboarding",
        search: { s: "create-space" },
      });
    }
  },
});

function AuthLayout() {
  return (
    // <div className="grid grid-rows-[auto_1fr] h-svh">
    //   <Header />
    //   <Outlet />
    // </div>

    <div className="flex h-full min-w-0 w-full flex-col overflow-x-hidden [--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex min-w-0 flex-col overflow-x-hidden">
        <Header />
        <div className="flex min-w-0 flex-1">
          <AppSidebar />
          <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden px-4 py-4 md:px-8 md:py-8">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
