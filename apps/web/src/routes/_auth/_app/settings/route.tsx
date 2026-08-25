import { createFileRoute } from "@tanstack/react-router";

import { SettingsLayout } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_auth/_app/settings")({
  component: SettingsLayout,
});
