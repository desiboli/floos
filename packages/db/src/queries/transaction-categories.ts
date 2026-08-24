import { CATEGORIES, getColorFromSlug } from "@floos/categories";
import { and, asc, count, eq, isNull } from "drizzle-orm";

import type { Database } from "..";

import { bankAccounts } from "../schema/bank-accounts";
import { bankTransactions } from "../schema/bank-transactions";
import { transactionCategories, type TransactionCategory } from "../schema/transaction-categories";

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

const UNCATEGORIZED_SLUG = "uncategorized";

function usageCount(value: number | string | bigint | null | undefined): number {
  return Number(value ?? 0);
}

export async function getCategories(db: Database, spaceId: string) {
  await ensureSystemCategoriesForSpace(db, spaceId);

  const rowsPromise = db
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

  const usagePromise = db
    .select({
      slug: bankTransactions.categorySlug,
      value: count(),
    })
    .from(bankTransactions)
    .where(eq(bankTransactions.spaceId, spaceId))
    .groupBy(bankTransactions.categorySlug);

  const [rows, usageRows] = await Promise.all([rowsPromise, usagePromise]);

  const usageBySlug = new Map<string, number>();
  for (const row of usageRows) {
    if (row.slug) usageBySlug.set(row.slug, usageCount(row.value));
  }

  const withUsage = (row: CategoryListItem) => ({
    ...row,
    transactionCount: usageBySlug.get(row.slug) ?? 0,
  });

  const parents = rows.filter((row) => row.parentId === null);
  const children = rows.filter((row) => row.parentId !== null);

  return parents.map((parent) => ({
    ...withUsage(parent),
    children: children.filter((child) => child.parentId === parent.id).map(withUsage),
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

const categoryListColumns = {
  id: transactionCategories.id,
  slug: transactionCategories.slug,
  name: transactionCategories.name,
  color: transactionCategories.color,
  description: transactionCategories.description,
  system: transactionCategories.system,
  excluded: transactionCategories.excluded,
  parentId: transactionCategories.parentId,
} as const;

/** Kebab-case, ASCII-ish slug. Empty input becomes `category`. */
export function slugFromName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug.length > 0 ? slug : "category";
}

async function uniqueSlugForSpace(db: Database, spaceId: string, base: string): Promise<string> {
  const rows = await db
    .select({ slug: transactionCategories.slug })
    .from(transactionCategories)
    .where(eq(transactionCategories.spaceId, spaceId));

  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

async function getParentInSpace(db: Database, spaceId: string, parentId: string) {
  const [parent] = await db
    .select({
      id: transactionCategories.id,
      color: transactionCategories.color,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(and(eq(transactionCategories.id, parentId), eq(transactionCategories.spaceId, spaceId)))
    .limit(1);

  if (!parent || parent.parentId !== null) return null;
  return parent;
}

export type CreateCategoryError = "invalid-parent";

export type CreateCategoryResult =
  | { ok: true; category: CategoryListItem }
  | { ok: false; error: CreateCategoryError };

export async function createCategory(
  db: Database,
  input: {
    spaceId: string;
    name: string;
    parentId: string;
    description?: string | null;
    color?: string | null;
  },
): Promise<CreateCategoryResult> {
  const parent = await getParentInSpace(db, input.spaceId, input.parentId);
  if (!parent) {
    return { ok: false, error: "invalid-parent" };
  }

  const name = input.name.trim();
  const slug = await uniqueSlugForSpace(db, input.spaceId, slugFromName(name));
  const description = input.description?.trim() ? input.description.trim() : null;
  const color = input.color?.trim() || parent.color || getColorFromSlug(slug);

  const [created] = await db
    .insert(transactionCategories)
    .values({
      spaceId: input.spaceId,
      parentId: parent.id,
      name,
      slug,
      color,
      description,
      system: false,
      excluded: false,
    })
    .returning(categoryListColumns);

  if (!created) {
    throw new Error("Failed to create category");
  }

  return { ok: true, category: created };
}

export type UpdateCategoryError = "not-found" | "invalid-parent";

export type UpdateCategoryResult =
  | { ok: true; category: CategoryListItem }
  | { ok: false; error: UpdateCategoryError };

export async function updateCategory(
  db: Database,
  input: {
    spaceId: string;
    id: string;
    name?: string;
    parentId?: string;
    description?: string | null;
    color?: string | null;
  },
): Promise<UpdateCategoryResult> {
  const [existing] = await db
    .select({
      id: transactionCategories.id,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(
      and(eq(transactionCategories.id, input.id), eq(transactionCategories.spaceId, input.spaceId)),
    )
    .limit(1);

  if (!existing) {
    return { ok: false, error: "not-found" };
  }

  if (input.parentId !== undefined) {
    if (existing.parentId === null || input.parentId === existing.id) {
      return { ok: false, error: "invalid-parent" };
    }

    const [descendant] = await db
      .select({ id: transactionCategories.id })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.spaceId, input.spaceId),
          eq(transactionCategories.parentId, existing.id),
        ),
      )
      .limit(1);

    if (descendant) {
      return { ok: false, error: "invalid-parent" };
    }

    const parent = await getParentInSpace(db, input.spaceId, input.parentId);
    if (!parent) {
      return { ok: false, error: "invalid-parent" };
    }
  }

  const patch: {
    name?: string;
    parentId?: string;
    description?: string | null;
    color?: string | null;
  } = {};

  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.parentId !== undefined) patch.parentId = input.parentId;
  if (input.description !== undefined) {
    patch.description = input.description?.trim() ? input.description.trim() : null;
  }
  if (input.color !== undefined) {
    patch.color = input.color?.trim() ? input.color.trim() : null;
  }

  const [updated] = await db
    .update(transactionCategories)
    .set(patch)
    .where(
      and(
        eq(transactionCategories.id, existing.id),
        eq(transactionCategories.spaceId, input.spaceId),
      ),
    )
    .returning(categoryListColumns);

  if (!updated) {
    return { ok: false, error: "not-found" };
  }

  return { ok: true, category: updated };
}

export type DeleteCategoryError = "not-found" | "forbidden";

export type DeleteCategoryResult = { ok: true } | { ok: false; error: DeleteCategoryError };

export async function deleteCategory(
  db: Database,
  input: { spaceId: string; id: string },
): Promise<DeleteCategoryResult> {
  const [existing] = await db
    .select({
      id: transactionCategories.id,
      slug: transactionCategories.slug,
      system: transactionCategories.system,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(
      and(eq(transactionCategories.id, input.id), eq(transactionCategories.spaceId, input.spaceId)),
    )
    .limit(1);

  if (!existing) {
    return { ok: false, error: "not-found" };
  }

  if (existing.system || existing.parentId === null) {
    return { ok: false, error: "forbidden" };
  }

  await db.transaction(async (tx) => {
    const [usage] = await tx
      .select({ value: count() })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.spaceId, input.spaceId),
          eq(bankTransactions.categorySlug, existing.slug),
        ),
      );

    if (usageCount(usage?.value) > 0) {
      let [uncategorized] = await tx
        .select({ slug: transactionCategories.slug })
        .from(transactionCategories)
        .where(
          and(
            eq(transactionCategories.spaceId, input.spaceId),
            eq(transactionCategories.slug, UNCATEGORIZED_SLUG),
          ),
        )
        .limit(1);

      if (!uncategorized) {
        await ensureSystemCategoriesForSpace(tx, input.spaceId);
        [uncategorized] = await tx
          .select({ slug: transactionCategories.slug })
          .from(transactionCategories)
          .where(
            and(
              eq(transactionCategories.spaceId, input.spaceId),
              eq(transactionCategories.slug, UNCATEGORIZED_SLUG),
            ),
          )
          .limit(1);
      }

      if (!uncategorized) {
        throw new Error("Uncategorized category is missing");
      }

      await tx
        .update(bankTransactions)
        .set({ categorySlug: uncategorized.slug })
        .where(
          and(
            eq(bankTransactions.spaceId, input.spaceId),
            eq(bankTransactions.categorySlug, existing.slug),
          ),
        );
    }

    await tx
      .delete(transactionCategories)
      .where(
        and(
          eq(transactionCategories.id, existing.id),
          eq(transactionCategories.spaceId, input.spaceId),
        ),
      );
  });

  return { ok: true };
}
