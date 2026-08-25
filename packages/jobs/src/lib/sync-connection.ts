import { Provider } from "@floos/banking";
import type { Database } from "@floos/db";
import {
  touchBankConnectionLastSyncAt,
  updateBankAccountBalances,
  updateBankConnectionStatus,
  upsertBankTransactions,
  type UpsertBankTransactionInput,
} from "@floos/db/queries";
import type { BankAccount, BankConnection } from "@floos/db/schema";
import { logger } from "@trigger.dev/sdk";

export type SyncConnectionResult = {
  connectionId: string;
  synced: number;
  newTransactionIds: string[];
  balancesUpdated: number;
};

const emptyResult = (connectionId: string): SyncConnectionResult => ({
  connectionId,
  synced: 0,
  newTransactionIds: [],
  balancesUpdated: 0,
});

/** Status from `Enable Banking API error (401):` / `GoCardless API error (401):`. */
function providerStatusCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith("GoCardless token/")) return undefined;
  const match = /API error \((\d{3})\)/.exec(message);
  return match ? Number(match[1]) : undefined;
}

function isDeadConsent(error: unknown) {
  const code = providerStatusCode(error);
  return code === 401 || code === 403;
}

/**
 * Refresh balances, then fetch provider transactions for enabled accounts.
 *
 * `latest: !manualSync`
 * - manualSync true  → full history (initial connect / reconnect)
 * - manualSync false → short window (~5 days; cron and settings refresh)
 */
export async function syncConnection(
  db: Database,
  params: {
    connection: BankConnection;
    accounts: BankAccount[];
    manualSync: boolean;
  },
): Promise<SyncConnectionResult> {
  const { connection, accounts, manualSync } = params;
  const latest = !manualSync;
  const provider = new Provider({ provider: connection.provider });
  const sessionId = connection.accessToken ?? connection.referenceId;

  if (!sessionId) {
    logger.warn("Connection has no session id, marking disconnected", {
      connectionId: connection.id,
    });
    await disconnectConnection(db, connection);
    return emptyResult(connection.id);
  }

  const { status: providerStatus } = await provider.getConnectionStatus({ id: sessionId });

  if (providerStatus === "disconnected") {
    logger.info("Provider reports connection is not live, marking disconnected", {
      connectionId: connection.id,
      provider: connection.provider,
    });
    await disconnectConnection(db, connection);
    return emptyResult(connection.id);
  }

  if (providerStatus !== "connected") {
    logger.info("Provider auth is not finished, skipping sync", {
      connectionId: connection.id,
      providerStatus,
    });
    return emptyResult(connection.id);
  }

  let synced = 0;
  let balancesUpdated = 0;
  const newTransactionIds: string[] = [];
  let attemptedAccounts = 0;
  let consentDeadAccounts = 0;

  for (const account of accounts) {
    if (!account.enabled) continue;
    attemptedAccounts += 1;

    try {
      const snapshot = await provider.getAccountBalance({
        accountId: account.accountId,
        currency: account.currency,
        accountType: account.type,
      });

      if (snapshot.amount != null) {
        await updateBankAccountBalances(db, {
          id: account.id,
          balance: snapshot.amount.toFixed(2),
          availableBalance:
            snapshot.availableBalance != null && Number.isFinite(snapshot.availableBalance)
              ? snapshot.availableBalance.toFixed(2)
              : null,
        });
        balancesUpdated += 1;
      }
    } catch (err) {
      logger.error("Failed to sync account balance", {
        connectionId: connection.id,
        bankAccountId: account.id,
        providerAccountId: account.accountId,
        error: err instanceof Error ? err.message : String(err),
      });

      if (isDeadConsent(err)) {
        consentDeadAccounts += 1;
        continue;
      }
    }

    try {
      const txns = await provider.getTransactions({
        accountId: account.accountId,
        latest,
        accountType: account.type,
      });

      if (txns.length === 0) continue;

      const rows: UpsertBankTransactionInput[] = txns.map((txn) => ({
        spaceId: connection.spaceId,
        bankAccountId: account.id,
        providerTransactionId: txn.id,
        date: txn.date,
        amount: txn.amount.toFixed(2),
        currency: txn.currency,
        name: txn.name,
        description: txn.description,
        status: txn.status,
        method: txn.method,
        counterpartyName: txn.counterpartyName,
        merchantName: txn.merchantName,
        balance: txn.balance != null ? txn.balance.toFixed(2) : null,
        currencyRate: txn.currencyRate != null ? String(txn.currencyRate) : null,
        currencySource: txn.currencySource,
      }));

      const inserted = await upsertBankTransactions(db, rows);
      synced += inserted.length;
      for (const row of inserted) {
        newTransactionIds.push(row.id);
      }
    } catch (err) {
      logger.error("Failed to sync account transactions", {
        connectionId: connection.id,
        bankAccountId: account.id,
        providerAccountId: account.accountId,
        error: err instanceof Error ? err.message : String(err),
      });

      if (isDeadConsent(err)) {
        consentDeadAccounts += 1;
        continue;
      }

      throw err;
    }
  }

  if (attemptedAccounts > 0 && consentDeadAccounts === attemptedAccounts) {
    logger.info("All enabled accounts failed with a dead consent, marking disconnected", {
      connectionId: connection.id,
      attemptedAccounts,
    });
    await disconnectConnection(db, connection);
    return {
      connectionId: connection.id,
      synced,
      newTransactionIds,
      balancesUpdated,
    };
  }

  await touchBankConnectionLastSyncAt(db, connection.id);

  return {
    connectionId: connection.id,
    synced,
    newTransactionIds,
    balancesUpdated,
  };
}

async function disconnectConnection(db: Database, connection: BankConnection) {
  await updateBankConnectionStatus(db, connection.id, connection.spaceId, "disconnected");
}
