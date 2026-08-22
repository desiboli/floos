import { and, desc, eq } from "drizzle-orm";

import type { Database } from "..";

import { bankAccounts } from "../schema/bank-accounts";
import { bankTransactions, type InsertBankTransaction } from "../schema/bank-transactions";

export type UpsertBankTransactionInput = Pick<
  InsertBankTransaction,
  | "spaceId"
  | "bankAccountId"
  | "providerTransactionId"
  | "date"
  | "amount"
  | "currency"
  | "name"
  | "description"
  | "status"
  | "method"
  | "counterpartyName"
  | "merchantName"
  | "balance"
  | "currencyRate"
  | "currencySource"
>;

export async function upsertBankTransactions(db: Database, rows: UpsertBankTransactionInput[]) {
  if (rows.length === 0) return [];

  return db
    .insert(bankTransactions)
    .values(rows)
    .onConflictDoNothing({
      target: [bankTransactions.bankAccountId, bankTransactions.providerTransactionId],
    })
    .returning({ id: bankTransactions.id });
}

export async function listBankTransactionsByConnection(
  db: Database,
  {
    spaceId,
    connectionId,
    limit = 100,
  }: {
    spaceId: string;
    connectionId: string;
    limit?: number;
  },
) {
  return db
    .select({
      id: bankTransactions.id,
      date: bankTransactions.date,
      amount: bankTransactions.amount,
      currency: bankTransactions.currency,
      name: bankTransactions.name,
      description: bankTransactions.description,
      status: bankTransactions.status,
      method: bankTransactions.method,
      counterpartyName: bankTransactions.counterpartyName,
      merchantName: bankTransactions.merchantName,
      balance: bankTransactions.balance,
      currencyRate: bankTransactions.currencyRate,
      currencySource: bankTransactions.currencySource,
    })
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .where(
      and(
        eq(bankTransactions.spaceId, spaceId),
        eq(bankAccounts.bankConnectionId, connectionId),
        eq(bankAccounts.enabled, true),
      ),
    )
    .orderBy(desc(bankTransactions.date))
    .limit(limit);
}
