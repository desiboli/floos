import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import type { Database } from "..";

import { bankTransactions } from "../schema/bank-transactions";

export type TransactionForEnrichment = {
  id: string;
  name: string;
  description: string | null;
  counterpartyName: string | null;
  merchantName: string | null;
  method: string | null;
  amount: string;
  currency: string;
  categorySlug: string | null;
};

export async function getTransactionsForEnrichment(
  db: Database,
  params: {
    spaceId: string;
    transactionIds?: string[];
  },
): Promise<TransactionForEnrichment[]> {
  if (params.transactionIds && params.transactionIds.length === 0) {
    return [];
  }

  const conditions = [
    eq(bankTransactions.spaceId, params.spaceId),
    isNull(bankTransactions.enrichmentCompletedAt),
  ];

  if (params.transactionIds) {
    conditions.push(inArray(bankTransactions.id, params.transactionIds));
  }

  return db
    .select({
      id: bankTransactions.id,
      name: bankTransactions.name,
      description: bankTransactions.description,
      counterpartyName: bankTransactions.counterpartyName,
      merchantName: bankTransactions.merchantName,
      method: bankTransactions.method,
      amount: bankTransactions.amount,
      currency: bankTransactions.currency,
      categorySlug: bankTransactions.categorySlug,
    })
    .from(bankTransactions)
    .where(and(...conditions));
}

export type TransactionEnrichmentUpdate = {
  id: string;
  merchantName?: string;
  categorySlug?: string;
};

/**
 * Write merchantName / categorySlug only when provided.
 * Always stamps enrichmentCompletedAt. COALESCE keeps a user-set value.
 */
export async function updateTransactionEnrichments(
  db: Database,
  params: {
    spaceId: string;
    updates: TransactionEnrichmentUpdate[];
  },
): Promise<void> {
  if (params.updates.length === 0) return;

  const completedAt = new Date();

  await db.transaction(async (tx) => {
    for (const update of params.updates) {
      await tx
        .update(bankTransactions)
        .set({
          enrichmentCompletedAt: completedAt,
          ...(update.merchantName !== undefined
            ? {
                merchantName: sql`coalesce(${bankTransactions.merchantName}, ${update.merchantName})`,
              }
            : {}),
          ...(update.categorySlug !== undefined
            ? {
                categorySlug: sql`coalesce(${bankTransactions.categorySlug}, ${update.categorySlug})`,
              }
            : {}),
        })
        .where(
          and(
            eq(bankTransactions.id, update.id),
            eq(bankTransactions.spaceId, params.spaceId),
            isNull(bankTransactions.enrichmentCompletedAt),
          ),
        );
    }
  });
}

/** Stamp enrichmentCompletedAt only. Used when the LLM batch fails. */
export async function markTransactionsAsEnriched(
  db: Database,
  params: {
    spaceId: string;
    ids: string[];
  },
): Promise<void> {
  if (params.ids.length === 0) return;

  await db
    .update(bankTransactions)
    .set({ enrichmentCompletedAt: new Date() })
    .where(
      and(
        eq(bankTransactions.spaceId, params.spaceId),
        inArray(bankTransactions.id, params.ids),
        isNull(bankTransactions.enrichmentCompletedAt),
      ),
    );
}
