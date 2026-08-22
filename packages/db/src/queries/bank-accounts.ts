import { and, eq, sql } from "drizzle-orm";

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
  return db.select().from(bankAccounts).where(eq(bankAccounts.bankConnectionId, bankConnectionId));
}

export async function getEnabledBankAccountsByConnection(db: Database, bankConnectionId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.bankConnectionId, bankConnectionId), eq(bankAccounts.enabled, true)));
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
