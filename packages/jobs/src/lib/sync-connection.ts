import { Provider } from "@floos/banking";
import type { Database } from "@floos/db";
import {
  touchBankConnectionLastSyncAt,
  upsertBankTransactions,
  type UpsertBankTransactionInput,
} from "@floos/db/queries";
import type { BankAccount, BankConnection } from "@floos/db/schema";
import { logger } from "@trigger.dev/sdk";

export type SyncConnectionResult = {
  connectionId: string;
  synced: number;
  newTransactionIds: string[];
};

/**
 * Fetch provider transactions for enabled accounts and upsert them.
 *
 * `latest: !manualSync`
 * - manualSync true  → full history (initial / user-triggered)
 * - manualSync false → short window (~5 days)
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

  let synced = 0;
  const newTransactionIds: string[] = [];

  for (const account of accounts) {
    if (!account.enabled) continue;

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
      throw err;
    }
  }

  await touchBankConnectionLastSyncAt(db, connection.id);

  return {
    connectionId: connection.id,
    synced,
    newTransactionIds,
  };
}
