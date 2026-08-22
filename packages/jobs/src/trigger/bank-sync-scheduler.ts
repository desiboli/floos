import { db } from "@floos/db";
import { listConnectedBankConnectionIdsBySpace } from "@floos/db/queries";
import { logger, schedules } from "@trigger.dev/sdk";

import { syncConnectionTransactions } from "./sync-connection-transactions";

/**
 * Daily fan-out: one schedule per space (externalId = spaceId).
 * When it fires, sync every connected bank with manualSync: false (short window).
 */
export const bankSyncScheduler = schedules.task({
  id: "bank-sync-scheduler",
  maxDuration: 120,
  run: async (payload) => {
    const spaceId = payload.externalId;

    if (!spaceId) {
      throw new Error("spaceId (externalId) is required");
    }

    const connections = await listConnectedBankConnectionIdsBySpace(db, spaceId);

    if (connections.length === 0) {
      logger.info("No bank connections to sync", { spaceId });
      return { fannedOut: 0 };
    }

    await syncConnectionTransactions.batchTrigger(
      connections.map((connection) => ({
        payload: {
          connectionId: connection.id,
          manualSync: false,
        },
      })),
    );

    logger.info("Fan-out complete", {
      spaceId,
      fannedOut: connections.length,
    });

    return { fannedOut: connections.length };
  },
});
