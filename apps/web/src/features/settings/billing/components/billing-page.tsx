import { Button } from "@floos/ui/components/button";
import { getRouteApi } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

const routeApi = getRouteApi("/_auth/_app/settings/billing");

export function BillingPage() {
  const { session, customerState } = routeApi.useRouteContext();
  const hasProSubscription = (customerState?.activeSubscriptions.length ?? 0) > 0;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.user.name}</p>
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
