import { CATEGORIES } from "@floos/categories";
import { and, asc, eq, isNull } from "drizzle-orm";

import type { Database } from "..";

import { bankAccounts } from "../schema/bank-accounts";
import { bankTransactions } from "../schema/bank-transactions";
import {
  transactionCategories,
  type TransactionCategory,
} from "../schema/transaction-categories";

type CategoryDb = Pick<Database, "insert" | "select">;

export type CategoryListItem = Pick<
  TransactionCategory,
  "id" | "slug" | "name" | "color" | "description" | "system" | "excluded" | "parentId"
>;

/**
 * Insert the system chart for a space. Safe to call again
 * (unique on spaceId + slug).
 */
export async function ensureSystemCategoriesForSpace(db: CategoryDb, spaceId: string) {
  await db
    .insert(transactionCategories)
    .values(
      CATEGORIES.map((parent) => ({
        spaceId,
        name: parent.name,
        slug: parent.slug,
        color: parent.color,
        system: true,
        excluded: parent.excluded,
      })),
    )
    .onConflictDoNothing({
      target: [transactionCategories.spaceId, transactionCategories.slug],
    });

  const parents = await db
    .select({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.spaceId, spaceId),
        isNull(transactionCategories.parentId),
        eq(transactionCategories.system, true),
      ),
    );

  const parentIdBySlug = new Map(parents.map((row) => [row.slug, row.id]));

  const children = CATEGORIES.flatMap((parent) => {
    const parentId = parentIdBySlug.get(parent.slug);
    if (!parentId) return [];

    return parent.children.map((child) => ({
      spaceId,
      parentId,
      name: child.name,
      slug: child.slug,
      color: child.color,
      system: true,
      excluded: child.excluded,
    }));
  });

  if (children.length === 0) return;

  await db
    .insert(transactionCategories)
    .values(children)
    .onConflictDoNothing({
      target: [transactionCategories.spaceId, transactionCategories.slug],
    });
}

export async function getCategories(db: Database, spaceId: string) {
  await ensureSystemCategoriesForSpace(db, spaceId);

  const rows = await db
    .select({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
      name: transactionCategories.name,
      color: transactionCategories.color,
      description: transactionCategories.description,
      system: transactionCategories.system,
      excluded: transactionCategories.excluded,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(eq(transactionCategories.spaceId, spaceId))
    .orderBy(asc(transactionCategories.name));

  const parents = rows.filter((row) => row.parentId === null);
  const children = rows.filter((row) => row.parentId !== null);

  return parents.map((parent) => ({
    ...parent,
    children: children.filter((child) => child.parentId === parent.id),
  }));
}

export type UpdateTransactionCategoryError = "not-found" | "invalid-category";

export type UpdateTransactionCategoryResult =
  | {
      ok: true;
      transaction: {
        id: string;
        date: string;
        amount: string;
        currency: string;
        name: string;
        description: string | null;
        status: string;
        method: string | null;
        counterpartyName: string | null;
        merchantName: string | null;
        categorySlug: string | null;
        enrichmentCompletedAt: Date | null;
        balance: string | null;
        currencyRate: string | null;
        currencySource: string | null;
        accountName: string;
      };
    }
  | { ok: false; error: UpdateTransactionCategoryError };

/**
 * Assign a child category that belongs to the space.
 * Does not stamp enrichmentCompletedAt so a pending merchant fill can still run.
 */
export async function updateTransactionCategory(
  db: Database,
  input: {
    spaceId: string;
    id: string;
    categorySlug: string;
  },
): Promise<UpdateTransactionCategoryResult> {
  const [existing] = await db
    .select({ id: bankTransactions.id })
    .from(bankTransactions)
    .where(and(eq(bankTransactions.id, input.id), eq(bankTransactions.spaceId, input.spaceId)))
    .limit(1);

  if (!existing) {
    return { ok: false, error: "not-found" };
  }

  const [category] = await db
    .select({ slug: transactionCategories.slug, parentId: transactionCategories.parentId })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.spaceId, input.spaceId),
        eq(transactionCategories.slug, input.categorySlug),
      ),
    )
    .limit(1);

  if (!category || category.parentId === null) {
    return { ok: false, error: "invalid-category" };
  }

  const [updated] = await db
    .update(bankTransactions)
    .set({ categorySlug: category.slug })
    .where(and(eq(bankTransactions.id, existing.id), eq(bankTransactions.spaceId, input.spaceId)))
    .returning({ id: bankTransactions.id });

  if (!updated) {
    return { ok: false, error: "not-found" };
  }

  const [row] = await db
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
    .where(and(eq(bankTransactions.id, updated.id), eq(bankTransactions.spaceId, input.spaceId)))
    .limit(1);

  if (!row) {
    return { ok: false, error: "not-found" };
  }

  return { ok: true, transaction: row };
}
