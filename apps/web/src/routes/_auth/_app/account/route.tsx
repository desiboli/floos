import { createFileRoute } from "@tanstack/react-router";

import { AccountLayout } from "@/features/account";

export const Route = createFileRoute("/_auth/_app/account")({
  component: AccountLayout,
});
