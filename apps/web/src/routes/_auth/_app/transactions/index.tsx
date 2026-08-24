import { createFileRoute } from "@tanstack/react-router";

import { TransactionsPage } from "@/features/transactions";

export const Route = createFileRoute("/_auth/_app/transactions/")({
  component: TransactionsPage,
});
