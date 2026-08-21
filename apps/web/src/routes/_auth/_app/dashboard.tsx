import { Button } from "@floos/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/_app/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session, customerState } = Route.useRouteContext();

  const hasProSubscription = (customerState?.activeSubscriptions?.length ?? 0) > 0;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.data?.user.name}</p>
      <p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
      {hasProSubscription ? (
        <Button onClick={async () => await authClient.customer.portal()}>
          Manage Subscription
        </Button>
      ) : (
        <Button onClick={async () => await authClient.checkout({ slug: "pro" })}>
          Upgrade to Pro
        </Button>
      )}
    </div>
  );
}
