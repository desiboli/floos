import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { OnboardingPage } from "@/features/onboarding";

const STEPS = ["create-space", "connect-bank", "select-accounts", "invite"] as const;

const searchSchema = z.object({
  s: z
    .enum([...STEPS, "reconciliation"])
    .default("create-space")
    .catch("create-space")
    .transform((step) => (step === "reconciliation" ? "invite" : step)),
  spaceId: z.string().optional(),
  bankConnected: z.uuid().optional(),
  bankError: z.string().optional(),
  connectionId: z.uuid().optional(),
});

export const Route = createFileRoute("/_auth/onboarding/")({
  validateSearch: searchSchema,
  component: OnboardingPage,
});
