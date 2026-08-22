import { createFileRoute } from "@tanstack/react-router";

import { InviteLanding } from "@/features/invites/components/invite-landing";

export const Route = createFileRoute("/invite/$token")({
  component: InviteRoute,
});

function InviteRoute() {
  const { token } = Route.useParams();
  return <InviteLanding token={token} />;
}
