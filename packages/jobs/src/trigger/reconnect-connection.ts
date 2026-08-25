import { Provider } from "@floos/banking";
import { db } from "@floos/db";
import { getBankAccountsByConnection, getBankConnectionByIdForSync } from "@floos/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { matchAndUpdateAccountIds } from "../lib/account-matching";
import { syncConnectionTransactions } from "./sync-connection-transactions";

export const reconnectConnection = schemaTask({
  id: "reconnect-connection",
  schema: z.object({
    connectionId: z.uuid(),
  }),
  maxDuration: 120,
  queue: { concurrencyLimit: 5 },
  run: async ({ connectionId }) => {
    const connection = await getBankConnectionByIdForSync(db, connectionId);

    if (!connection) {
      logger.warn("Connection not found for reconnect", { connectionId });
      return null;
    }

    const sessionId = connection.accessToken ?? connection.referenceId;

    if (!sessionId) {
      throw new Error("Connection has no session id");
    }

    const existingAccounts = await getBankAccountsByConnection(db, connectionId);
    const banking = new Provider({ provider: connection.provider });
    const apiAccounts = await banking.getAccounts({ id: sessionId });

    if (existingAccounts.length === 0) {
      logger.warn("No existing bank accounts found for connection", { connectionId });
    } else {
      await matchAndUpdateAccountIds(db, existingAccounts, apiAccounts, connectionId);
    }

    const handle = await syncConnectionTransactions.trigger({
      connectionId,
      manualSync: true,
    });

    if (connection.provider === "gocardless") {
      await syncConnectionTransactions.trigger(
        { connectionId, manualSync: true },
        { delay: "5m" },
      );
    }

    logger.info("Triggered full sync after reconnect", {
      connectionId,
      runId: handle.id,
    });

    return { connectionId, syncRunId: handle.id };
  },
});
