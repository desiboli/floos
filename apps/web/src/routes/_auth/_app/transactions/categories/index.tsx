import { createFileRoute } from "@tanstack/react-router";

import { CategoriesPage } from "@/features/categories";

export const Route = createFileRoute("/_auth/_app/transactions/categories/")({
  component: CategoriesPage,
});
