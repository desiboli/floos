import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header from "@/components/header";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/_app")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: "/login" });

    // const spaces = await getSpacesForUser(session.data.user.id); // your API
    // if (spaces.length === 0) {
    //   throw redirect({
    //     to: "/onboarding",
    //     search: { s: "create-space" },
    //   });
    // }

    return { session }; //TODO: add spaces
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
