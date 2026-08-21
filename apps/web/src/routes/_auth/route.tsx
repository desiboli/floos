import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { sanitizeRedirectPath } from "@/lib/sanitize-redirect";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      const returnTo = sanitizeRedirectPath(`${location.pathname}${location.searchStr}`);

      throw redirect({
        to: "/login",
        search: returnTo === "/" ? {} : { return_to: returnTo },
      });
    }

    return { session };
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
