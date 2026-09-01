import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { TransactionsPage } from "@/features/transactions";

const searchSchema = z.object({
  txn: z.uuid().optional(),
});

export const Route = createFileRoute("/_auth/_app/transactions/")({
  validateSearch: searchSchema,
  component: TransactionsPage,
});
