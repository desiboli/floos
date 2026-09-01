import { and, eq } from "drizzle-orm";

import type { Database } from "..";

import { user } from "../schema/auth";
import { spaceMembers, spaces, type InsertSpace } from "../schema/spaces";
import { ensureSystemCategoriesForSpace } from "./transaction-categories";

export async function createSpace(
  db: Database,
  input: Pick<InsertSpace, "name" | "country" | "currency"> & {
    userId: string;
  },
) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(spaces)
      .values({
        name: input.name,
        country: input.country,
        currency: input.currency,
      })
      .returning({ id: spaces.id });

    if (!created) {
      throw new Error("Failed to create space");
    }

    await tx.insert(spaceMembers).values({
      spaceId: created.id,
      userId: input.userId,
      role: "owner",
    });

    await ensureSystemCategoriesForSpace(tx, created.id);

    await tx.update(user).set({ activeSpaceId: created.id }).where(eq(user.id, input.userId));

    return created.id;
  });
}

export async function getSpacesForUser(db: Database, userId: string) {
  return db
    .select({
      id: spaces.id,
      name: spaces.name,
      country: spaces.country,
      currency: spaces.currency,
    })
    .from(spaces)
    .innerJoin(spaceMembers, eq(spaceMembers.spaceId, spaces.id))
    .where(eq(spaceMembers.userId, userId));
}

export async function getUserById(db: Database, userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}

export async function getActiveSpaceId(db: Database, userId: string) {
  const [row] = await db
    .select({ activeSpaceId: user.activeSpaceId })
    .from(user)
    .where(eq(user.id, userId));
  return row?.activeSpaceId ?? null;
}

export async function getActiveSpace(db: Database, userId: string) {
  const [row] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      country: spaces.country,
      currency: spaces.currency,
    })
    .from(user)
    .innerJoin(spaces, eq(user.activeSpaceId, spaces.id))
    .where(eq(user.id, userId));

  return row ?? null;
}

export async function getSpaceById(db: Database, spaceId: string) {
  const [row] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      country: spaces.country,
      currency: spaces.currency,
    })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);
  return row ?? null;
}

export async function getSpaceMemberRole(db: Database, spaceId: string, userId: string) {
  const [row] = await db
    .select({ role: spaceMembers.role })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.spaceId, spaceId)))
    .limit(1);

  if (!row) return null;
  if (row.role === "owner" || row.role === "member") return row.role;
  return null;
}

export async function setActiveSpace(db: Database, userId: string, spaceId: string) {
  const [membership] = await db
    .select({ id: spaceMembers.id })
    .from(spaceMembers)
    .where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.spaceId, spaceId)))
    .limit(1);

  if (!membership) {
    throw new Error("User is not a member of this space");
  }

  await db.update(user).set({ activeSpaceId: spaceId }).where(eq(user.id, userId));

  return { spaceId };
}
