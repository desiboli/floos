import { and, asc, eq, sql } from "drizzle-orm";

import type { Database } from "..";

import { bankAccounts, type InsertBankAccount } from "../schema/bank-accounts";

export type CreateBankAccountInput = Pick<
  InsertBankAccount,
  "spaceId" | "bankConnectionId" | "accountId" | "name" | "type" | "currency" | "iban" | "bic"
> & {
  balance?: string;
  availableBalance?: string | null;
  creditLimit?: string | null;
  enabled?: boolean;
  isManual?: boolean;
};

export async function createBankAccounts(db: Database, accounts: CreateBankAccountInput[]) {
  if (accounts.length === 0) return [];

  return db
    .insert(bankAccounts)
    .values(accounts)
    .onConflictDoUpdate({
      target: [bankAccounts.bankConnectionId, bankAccounts.accountId],
      set: {
        name: sql`excluded.name`,
        type: sql`excluded.type`,
        balance: sql`excluded.balance`,
        availableBalance: sql`excluded.available_balance`,
        creditLimit: sql`excluded.credit_limit`,
        currency: sql`excluded.currency`,
        iban: sql`excluded.iban`,
        bic: sql`excluded.bic`,
        enabled: sql`excluded.enabled`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
}

export async function getBankAccountsByConnection(db: Database, bankConnectionId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.bankConnectionId, bankConnectionId))
    .orderBy(asc(bankAccounts.createdAt), asc(bankAccounts.id));
}

export async function listBankAccountsBySpace(db: Database, spaceId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.spaceId, spaceId))
    .orderBy(asc(bankAccounts.createdAt), asc(bankAccounts.id));
}

export async function getEnabledBankAccountsByConnection(db: Database, bankConnectionId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.bankConnectionId, bankConnectionId), eq(bankAccounts.enabled, true)))
    .orderBy(asc(bankAccounts.createdAt), asc(bankAccounts.id));
}

export async function updateBankAccountBalances(
  db: Database,
  {
    id,
    balance,
    availableBalance,
  }: {
    id: string;
    balance: string;
    availableBalance: string | null;
  },
) {
  const [result] = await db
    .update(bankAccounts)
    .set({
      balance,
      availableBalance,
      updatedAt: sql`now()`,
    })
    .where(eq(bankAccounts.id, id))
    .returning({ id: bankAccounts.id });

  return result ?? null;
}

export async function updateBankAccountEnabled(
  db: Database,
  {
    id,
    spaceId,
    enabled,
  }: {
    id: string;
    spaceId: string;
    enabled: boolean;
  },
) {
  const [result] = await db
    .update(bankAccounts)
    .set({ enabled, updatedAt: sql`now()` })
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.spaceId, spaceId)))
    .returning({
      id: bankAccounts.id,
      enabled: bankAccounts.enabled,
    });

  return result ?? null;
}

/**
 * Rewrite provider-native account ids after reconnect.
 * Updates by bank_accounts.id only. Parks ids first so unique(connection, accountId)
 * cannot collide when two rows swap.
 */
export async function remapBankAccountProviderIds(
  db: Database,
  remaps: Array<{ id: string; accountId: string; iban: string | null }>,
) {
  if (remaps.length === 0) return;

  await db.transaction(async (tx) => {
    for (const row of remaps) {
      await tx
        .update(bankAccounts)
        .set({
          accountId: `__reconnect_${row.id}`,
          updatedAt: sql`now()`,
        })
        .where(eq(bankAccounts.id, row.id));
    }

    for (const row of remaps) {
      await tx
        .update(bankAccounts)
        .set({
          accountId: row.accountId,
          ...(row.iban ? { iban: row.iban } : {}),
          updatedAt: sql`now()`,
        })
        .where(eq(bankAccounts.id, row.id));
    }
  });
}
