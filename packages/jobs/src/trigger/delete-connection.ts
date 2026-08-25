import { Provider } from "@floos/banking";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

function isProviderGone(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\((404|410)\)/.test(message);
}

export const deleteConnection = schemaTask({
  id: "delete-connection",
  schema: z.object({
    provider: z.enum(["gocardless", "enablebanking"]),
    sessionId: z.string().min(1),
  }),
  maxDuration: 60,
  queue: { concurrencyLimit: 5 },
  run: async ({ provider, sessionId }) => {
    try {
      await new Provider({ provider }).deleteConnection({ id: sessionId });
      logger.info("Revoked provider connection", { provider });
    } catch (err) {
      if (isProviderGone(err)) {
        logger.warn("Provider connection already gone", { provider });
        return;
      }
      throw err;
    }
  },
});
