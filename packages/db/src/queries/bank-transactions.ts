import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

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

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Columns the list query can order by. Each one needs a matching
 * `(space_id, <column> DESC, id DESC)` index so keyset paging stays cheap;
 * Postgres scans that index backwards for the ascending direction.
 */
export const TRANSACTION_SORT_FIELDS = ["date", "amount"] as const;

export type TransactionSortField = (typeof TRANSACTION_SORT_FIELDS)[number];
export type TransactionSortDirection = "asc" | "desc";

const sortColumns: Record<TransactionSortField, PgColumn> = {
  date: bankTransactions.date,
  amount: bankTransactions.amount,
};

/** Cursor payload: the sort value of the last returned row plus its id. */
function parseCursor(cursor: string | undefined): { value: string; id: string } | null {
  if (!cursor) return null;
  // Sort values may contain "|", ids never do.
  const separator = cursor.lastIndexOf("|");
  if (separator <= 0 || separator === cursor.length - 1) return null;
  const value = cursor.slice(0, separator);
  const id = cursor.slice(separator + 1);
  if (!value || !id) return null;
  return { value, id };
}

/**
 * Bank transactions for a space, keyset-paginated.
 * Cursor format: `${sortValue}|${id}`, exclusive, and only valid for the same
 * sort field and direction that produced it.
 * Only includes transactions on enabled bank accounts.
 */
export async function listBankTransactionsForSpace(
  db: Database,
  {
    spaceId,
    cursor,
    pageSize = DEFAULT_PAGE_SIZE,
    sort = "date",
    direction = "desc",
  }: {
    spaceId: string;
    cursor?: string | null;
    pageSize?: number;
    sort?: TransactionSortField;
    direction?: TransactionSortDirection;
  },
) {
  const limit = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const parsedCursor = parseCursor(cursor ?? undefined);
  const sortColumn = sortColumns[sort];
  const isAscending = direction === "asc";
  const comesAfterCursor = isAscending ? gt : lt;
  const orderBy = isAscending ? asc : desc;

  const conditions = [eq(bankTransactions.spaceId, spaceId), eq(bankAccounts.enabled, true)];

  if (parsedCursor) {
    conditions.push(
      or(
        comesAfterCursor(sortColumn, parsedCursor.value),
        and(
          eq(sortColumn, parsedCursor.value),
          comesAfterCursor(bankTransactions.id, parsedCursor.id),
        ),
      )!,
    );
  }

  const rows = await db
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
      categorySlug: bankTransactions.categorySlug,
      enrichmentCompletedAt: bankTransactions.enrichmentCompletedAt,
      balance: bankTransactions.balance,
      currencyRate: bankTransactions.currencyRate,
      currencySource: bankTransactions.currencySource,
      accountName: bankAccounts.name,
    })
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .where(and(...conditions))
    .orderBy(orderBy(sortColumn), orderBy(bankTransactions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const transactions = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = transactions[transactions.length - 1];
  // Built from the raw column value so numeric formatting round-trips exactly.
  const nextCursor = hasMore && lastRow ? `${lastRow[sort]}|${lastRow.id}` : null;

  return { transactions, nextCursor };
}
