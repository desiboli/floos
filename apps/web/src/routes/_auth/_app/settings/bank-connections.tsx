import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { BankConnectionsPage } from "@/features/settings/bank-connections";

const searchSchema = z.object({
  bankReconnected: z.uuid().optional(),
  bankError: z.string().optional(),
});

export const Route = createFileRoute("/_auth/_app/settings/bank-connections")({
  validateSearch: searchSchema,
  component: BankConnectionsPage,
});
