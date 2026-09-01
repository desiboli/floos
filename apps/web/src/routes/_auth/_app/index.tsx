import { createFileRoute } from "@tanstack/react-router";

import { OverviewPage } from "@/features/overview";

type OverviewSearch = {
  assistant?: boolean;
};

export const Route = createFileRoute("/_auth/_app/")({
  validateSearch: (search: Record<string, unknown>): OverviewSearch => ({
    assistant: search.assistant === true || search.assistant === "true" ? true : undefined,
  }),
  component: OverviewPage,
});
