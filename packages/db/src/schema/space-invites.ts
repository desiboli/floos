import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { spaces } from "./spaces";

export const spaceInviteStatuses = [
  "pending",
  "accepted",
  "expired",
  "revoked",
  "declined",
] as const;

export type SpaceInviteStatus = (typeof spaceInviteStatuses)[number];

/**
 * Household space invitations. Tokens are stored hashed only.
 * Partial unique on (spaceId, email) WHERE pending — a later re-invite after
 * leave/decline/revoke is allowed; a second pending invite for the same email is not.
 */
export const spaceInvites = pgTable(
  "space_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    status: text("status").notNull().default("pending").$type<SpaceInviteStatus>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("space_invites_token_hash_uidx").on(table.tokenHash),
    uniqueIndex("space_invites_space_id_email_pending_uidx")
      .on(table.spaceId, table.email)
      .where(sql`${table.status} = 'pending'`),
    index("space_invites_email_idx").on(table.email),
    index("space_invites_space_id_idx").on(table.spaceId),
  ],
);

export type SpaceInvite = typeof spaceInvites.$inferSelect;
export type InsertSpaceInvite = typeof spaceInvites.$inferInsert;
