import { index, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { bankProviderEnum } from "./institutions";
import { spaces } from "./spaces";

export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "connected",
  "disconnected",
]);

/**
 * One bank link attempt per space + institution.
 * accessToken / referenceId hold the GC requisition id or EB session/auth id.
 */
export const bankConnections = pgTable(
  "bank_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").notNull(),
    provider: bankProviderEnum("provider").notNull(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    accessToken: text("access_token"),
    referenceId: text("reference_id"),
    status: connectionStatusEnum("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bank_connections_space_id_idx").on(table.spaceId),
    unique("unique_bank_connection").on(table.institutionId, table.spaceId),
  ],
);

export type BankConnection = typeof bankConnections.$inferSelect;
export type InsertBankConnection = typeof bankConnections.$inferInsert;
