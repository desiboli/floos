import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
    <div className="grid grid-rows-[auto_1fr] h-svh">
      <Header />
      <Outlet />
    </div>
  );
}
