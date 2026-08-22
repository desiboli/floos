import { db } from "@floos/db";
import { getBankAccountsByConnection, getBankConnectionByIdForSync } from "@floos/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { syncConnection } from "../lib/sync-connection";

export const syncConnectionTransactions = schemaTask({
  id: "sync-connection-transactions",
  schema: z.object({
    connectionId: z.uuid(),
    /** true = full history; false/omit = short window (~5 days). */
    manualSync: z.boolean().default(false),
  }),
  maxDuration: 600,
  queue: { concurrencyLimit: 10 },
  run: async ({ connectionId, manualSync }) => {
    const connection = await getBankConnectionByIdForSync(db, connectionId);

    if (!connection) {
      logger.warn("Connection not found, skipping", { connectionId });
      return null;
    }

    if (connection.status !== "connected" || !connection.accessToken) {
      logger.warn("Connection not ready for sync, skipping", {
        connectionId,
        status: connection.status,
        hasAccessToken: Boolean(connection.accessToken),
      });
      return null;
    }

    const accounts = await getBankAccountsByConnection(db, connectionId);

    const result = await syncConnection(db, {
      connection,
      accounts,
      manualSync,
    });

    logger.info("Sync finished", {
      connectionId,
      synced: result.synced,
      balancesUpdated: result.balancesUpdated,
      manualSync,
    });

    if (result.newTransactionIds.length > 0) {
      // later: enqueue categorize/enrich
    }

    return result;
  },
});
