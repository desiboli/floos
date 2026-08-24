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

    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="py-4 md:py-8 px-4 md:px-8">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
