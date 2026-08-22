import { and, eq, sql } from "drizzle-orm";

import type { Database } from "..";

import { bankConnections, type InsertBankConnection } from "../schema/bank-connections";

export type CreateBankConnectionInput = Pick<
  InsertBankConnection,
  "spaceId" | "institutionId" | "provider" | "name" | "logoUrl" | "accessToken" | "referenceId"
> & {
  expiresAt?: string | null;
};

export async function createBankConnection(db: Database, input: CreateBankConnectionInput) {
  const { expiresAt, ...rest } = input;

  const [result] = await db
    .insert(bankConnections)
    .values({
      ...rest,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  if (!result) {
    throw new Error("Failed to create bank connection");
  }

  return result;
}

export async function updateBankConnectionLink(
  db: Database,
  id: string,
  input: {
    accessToken: string;
    referenceId: string;
    expiresAt?: string | null;
  },
) {
  const [result] = await db
    .update(bankConnections)
    .set({
      accessToken: input.accessToken,
      referenceId: input.referenceId,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .where(eq(bankConnections.id, id))
    .returning();

  return result ?? null;
}

export async function getBankConnectionById(db: Database, id: string, spaceId: string) {
  const [result] = await db
    .select()
    .from(bankConnections)
    .where(and(eq(bankConnections.id, id), eq(bankConnections.spaceId, spaceId)))
    .limit(1);

  return result ?? null;
}

/** Load a connection by id for system jobs (Trigger). No space scoping. */
export async function getBankConnectionByIdForSync(db: Database, id: string) {
  const [result] = await db
    .select()
    .from(bankConnections)
    .where(eq(bankConnections.id, id))
    .limit(1);

  return result ?? null;
}

/** Connected bank links for a space — used by the daily bank-sync scheduler. */
export async function listConnectedBankConnectionIdsBySpace(db: Database, spaceId: string) {
  return db
    .select({ id: bankConnections.id })
    .from(bankConnections)
    .where(and(eq(bankConnections.spaceId, spaceId), eq(bankConnections.status, "connected")));
}

export async function getBankConnectionByInstitution(
  db: Database,
  spaceId: string,
  institutionId: string,
) {
  const [result] = await db
    .select()
    .from(bankConnections)
    .where(
      and(eq(bankConnections.spaceId, spaceId), eq(bankConnections.institutionId, institutionId)),
    )
    .limit(1);

  return result ?? null;
}

export async function updateBankConnectionStatus(
  db: Database,
  id: string,
  spaceId: string,
  status: "connected" | "disconnected" | "pending",
) {
  const [result] = await db
    .update(bankConnections)
    .set({ status })
    .where(and(eq(bankConnections.id, id), eq(bankConnections.spaceId, spaceId)))
    .returning();

  return result ?? null;
}

export async function updateBankConnectionLastSyncAt(db: Database, id: string, spaceId: string) {
  const [result] = await db
    .update(bankConnections)
    .set({ lastSyncAt: sql`now()` })
    .where(and(eq(bankConnections.id, id), eq(bankConnections.spaceId, spaceId)))
    .returning();

  return result ?? null;
}

/** Mark a successful sync from a job (id-only, no space scope). */
export async function touchBankConnectionLastSyncAt(db: Database, connectionId: string) {
  await db
    .update(bankConnections)
    .set({ lastSyncAt: sql`now()` })
    .where(eq(bankConnections.id, connectionId));
}

export async function deleteBankConnection(db: Database, id: string, spaceId: string) {
  await db
    .delete(bankConnections)
    .where(and(eq(bankConnections.id, id), eq(bankConnections.spaceId, spaceId)));
}

/**
 * Clears unfinished Connect clicks so retries don't hit unique(institutionId, spaceId).
 * Does not touch connected/disconnected rows.
 */
export async function deletePendingBankConnection(
  db: Database,
  spaceId: string,
  institutionId: string,
) {
  await db
    .delete(bankConnections)
    .where(
      and(
        eq(bankConnections.spaceId, spaceId),
        eq(bankConnections.institutionId, institutionId),
        eq(bankConnections.status, "pending"),
      ),
    );
}
