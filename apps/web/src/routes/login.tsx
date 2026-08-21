import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { LoginPage } from "@/features/auth";
import { spacesQueryOptions } from "@/features/spaces/services/queries";
import { authClient } from "@/lib/auth-client";
import { sanitizeRedirectPath } from "@/lib/sanitize-redirect";

const loginSearchSchema = z.object({
  return_to: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      return;
    }

    const { spaces } = await context.queryClient.ensureQueryData(spacesQueryOptions());

    if (spaces.length === 0) {
      throw redirect({
        to: "/onboarding",
        search: { s: "create-space" },
      });
    }

    const destination = search.return_to ? sanitizeRedirectPath(search.return_to) : "/";

    if (destination === "/") {
      throw redirect({ to: "/" });
    }

    throw redirect({ href: destination });
  },
  component: LoginPage,
});
