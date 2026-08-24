import {
  date,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { bankAccounts } from "./bank-accounts";
import { spaces } from "./spaces";
import { transactionCategories } from "./transaction-categories";

/**
 * Booked transactions imported from a provider for a bank account.
 * providerTransactionId is the provider-stable unique id (not transaction_id on EB).
 */
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "cascade" }),
    providerTransactionId: text("provider_transaction_id").notNull(),
    date: date("date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("posted").notNull(),
    method: text("method"),
    counterpartyName: text("counterparty_name"),
    merchantName: text("merchant_name"),
    categorySlug: text("category_slug"),
    enrichmentCompletedAt: timestamp("enrichment_completed_at", { withTimezone: true }),
    balance: numeric("balance", { precision: 12, scale: 2 }),
    currencyRate: numeric("currency_rate"),
    currencySource: text("currency_source"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("unique_bank_transaction").on(table.bankAccountId, table.providerTransactionId),
    index("bank_transactions_space_id_idx").on(table.spaceId),
    index("bank_transactions_bank_account_id_idx").on(table.bankAccountId),
    index("bank_transactions_date_idx").on(table.date),
    // Serve the keyset list query, one index per sortable column. Postgres scans
    // these backwards for the ascending direction, so one index covers both.
    index("bank_transactions_space_id_date_id_idx").on(
      table.spaceId,
      table.date.desc(),
      table.id.desc(),
    ),
    index("bank_transactions_space_id_amount_id_idx").on(
      table.spaceId,
      table.amount.desc(),
      table.id.desc(),
    ),
    foreignKey({
      name: "bank_transactions_space_id_category_slug_fkey",
      columns: [table.spaceId, table.categorySlug],
      foreignColumns: [transactionCategories.spaceId, transactionCategories.slug],
    }),
  ],
);

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof bankTransactions.$inferInsert;
