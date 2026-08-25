import { createFileRoute } from "@tanstack/react-router";

import { BillingPage } from "@/features/settings/billing";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/_app/settings/billing")({
  beforeLoad: async () => {
    const { data: customerState } = await authClient.customer.state();
    return { customerState };
  },
  component: BillingPage,
});
