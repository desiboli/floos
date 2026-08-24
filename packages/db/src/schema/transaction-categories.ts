import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { spaces } from "./spaces";

/**
 * Categories for a space. System rows are seeded from @floos/categories;
 * users can add their own under a parent later.
 */
export const transactionCategories = pgTable(
  "transaction_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    description: text("description"),
    system: boolean("system").default(false).notNull(),
    excluded: boolean("excluded").default(false).notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => transactionCategories.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("transaction_categories_space_id_idx").on(table.spaceId),
    index("transaction_categories_parent_id_idx").on(table.parentId),
    unique("transaction_categories_space_slug_uidx").on(table.spaceId, table.slug),
  ],
);

export type TransactionCategory = typeof transactionCategories.$inferSelect;
export type InsertTransactionCategory = typeof transactionCategories.$inferInsert;
