import { INCOME_CATEGORIES } from "@floos/categories";
import { and, asc, desc, eq, gt, gte, ilike, isNull, lt, lte, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import type { Database } from "..";

import { bankAccounts } from "../schema/bank-accounts";
import { bankTransactions, type InsertBankTransaction } from "../schema/bank-transactions";
import { transactionCategories } from "../schema/transaction-categories";

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
function likeContains(query: string) {
  return `%${query.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
}

const transactionListColumns = {
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
} as const;

export async function listBankTransactionsForSpace(
  db: Database,
  {
    spaceId,
    cursor,
    pageSize = DEFAULT_PAGE_SIZE,
    sort = "date",
    direction = "desc",
    from,
    to,
    accountId,
    categorySlug,
    merchantQuery,
    minAmount,
    maxAmount,
  }: {
    spaceId: string;
    cursor?: string | null;
    pageSize?: number;
    sort?: TransactionSortField;
    direction?: TransactionSortDirection;
    from?: string;
    to?: string;
    accountId?: string;
    categorySlug?: string;
    merchantQuery?: string;
    minAmount?: number;
    maxAmount?: number;
  },
) {
  const limit = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const parsedCursor = parseCursor(cursor ?? undefined);
  const sortColumn = sortColumns[sort];
  const isAscending = direction === "asc";
  const comesAfterCursor = isAscending ? gt : lt;
  const orderBy = isAscending ? asc : desc;

  const conditions = [eq(bankTransactions.spaceId, spaceId), eq(bankAccounts.enabled, true)];

  if (from) conditions.push(gte(bankTransactions.date, from));
  if (to) conditions.push(lte(bankTransactions.date, to));
  if (accountId) conditions.push(eq(bankTransactions.bankAccountId, accountId));
  if (categorySlug) conditions.push(eq(bankTransactions.categorySlug, categorySlug));
  if (minAmount != null) conditions.push(gte(bankTransactions.amount, String(minAmount)));
  if (maxAmount != null) conditions.push(lte(bankTransactions.amount, String(maxAmount)));
  if (merchantQuery?.trim()) {
    const pattern = likeContains(merchantQuery.trim());
    conditions.push(
      or(
        ilike(bankTransactions.merchantName, pattern),
        ilike(bankTransactions.name, pattern),
        ilike(bankTransactions.counterpartyName, pattern),
      )!,
    );
  }

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
    .select(transactionListColumns)
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

export type BankTransactionListRow = Awaited<
  ReturnType<typeof listBankTransactionsForSpace>
>["transactions"][number];

export async function getBankTransactionForSpace(
  db: Database,
  { spaceId, id }: { spaceId: string; id: string },
) {
  const [row] = await db
    .select(transactionListColumns)
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .where(
      and(
        eq(bankTransactions.id, id),
        eq(bankTransactions.spaceId, spaceId),
        eq(bankAccounts.enabled, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

function periodRangeConditions(spaceId: string, from: string, to: string, accountId?: string) {
  const conditions = [
    eq(bankTransactions.spaceId, spaceId),
    eq(bankAccounts.enabled, true),
    gte(bankTransactions.date, from),
    lte(bankTransactions.date, to),
  ];
  if (accountId) conditions.push(eq(bankTransactions.bankAccountId, accountId));
  return conditions;
}

export async function spendingByCategoryForSpace(
  db: Database,
  {
    spaceId,
    from,
    to,
    accountId,
    includeExcluded = false,
  }: {
    spaceId: string;
    from: string;
    to: string;
    accountId?: string;
    includeExcluded?: boolean;
  },
) {
  const conditions = periodRangeConditions(spaceId, from, to, accountId);
  if (!includeExcluded) {
    conditions.push(or(eq(transactionCategories.excluded, false), isNull(transactionCategories.id))!);
  }

  const rows = await db
    .select({
      categorySlug: bankTransactions.categorySlug,
      categoryName: transactionCategories.name,
      outflow: sql<string>`abs(coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.amount}::numeric < 0), 0))`,
      inflow: sql<string>`coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.amount}::numeric > 0), 0)`,
      currency: sql<string>`min(${bankTransactions.currency})`,
      count: sql<number>`count(*)::int`,
    })
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.spaceId, bankTransactions.spaceId),
        eq(transactionCategories.slug, bankTransactions.categorySlug),
      ),
    )
    .where(and(...conditions))
    .groupBy(bankTransactions.categorySlug, transactionCategories.name);

  const incomeSlugs = new Set<string>([...INCOME_CATEGORIES, "uncategorized"]);

  return rows
    .map((row) => {
      const outflow = Number(row.outflow);
      const inflow = Number(row.inflow);
      const slug = row.categorySlug ?? "uncategorized";
      // Outgoing (negative) is spend. If a non-income category only has positives,
      // the feed inverted the sign — still treat that inflow as spend.
      const total =
        outflow > 0 ? outflow : incomeSlugs.has(slug) ? 0 : inflow;
      return {
        categorySlug: row.categorySlug,
        categoryName: row.categoryName,
        total: String(total),
        currency: row.currency,
        count: row.count,
      };
    })
    .filter((row) => Number(row.total) > 0)
    .toSorted((a, b) => Number(b.total) - Number(a.total));
}

export async function spendingOverTimeForSpace(
  db: Database,
  {
    spaceId,
    from,
    to,
    groupBy,
  }: {
    spaceId: string;
    from: string;
    to: string;
    groupBy: "month" | "week";
  },
) {
  const periodExpr =
    groupBy === "week"
      ? sql<string>`to_char(date_trunc('week', ${bankTransactions.date}::timestamp), 'YYYY-MM-DD')`
      : sql<string>`to_char(date_trunc('month', ${bankTransactions.date}::timestamp), 'YYYY-MM')`;

  return db
    .select({
      period: periodExpr,
      income: sql<string>`coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.amount}::numeric > 0), 0)`,
      expenses: sql<string>`abs(coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.amount}::numeric < 0), 0))`,
      net: sql<string>`coalesce(sum(${bankTransactions.amount}), 0)`,
      currency: sql<string>`min(${bankTransactions.currency})`,
    })
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .where(and(...periodRangeConditions(spaceId, from, to)))
    .groupBy(periodExpr)
    .orderBy(periodExpr);
}

export async function cashTotalsForSpace(
  db: Database,
  { spaceId, from, to }: { spaceId: string; from: string; to: string },
) {
  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.amount}::numeric > 0), 0)`,
      expenses: sql<string>`abs(coalesce(sum(${bankTransactions.amount}) filter (where ${bankTransactions.amount}::numeric < 0), 0))`,
      net: sql<string>`coalesce(sum(${bankTransactions.amount}), 0)`,
      currency: sql<string>`min(${bankTransactions.currency})`,
    })
    .from(bankTransactions)
    .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .where(and(...periodRangeConditions(spaceId, from, to)));

  return (
    row ?? {
      income: "0",
      expenses: "0",
      net: "0",
      currency: null,
    }
  );
}
