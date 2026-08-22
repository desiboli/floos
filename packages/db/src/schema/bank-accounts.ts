import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { bankConnections } from "./bank-connections";
import { spaces } from "./spaces";

export const accountTypeEnum = pgEnum("account_type", [
  "depository",
  "credit",
  "loan",
  "investment",
  "other",
]);

/**
 * Accounts belonging to a space (usually linked via a bank connection).
 * accountId = provider-native id from @floos/banking Account.id
 */
export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    bankConnectionId: uuid("bank_connection_id").references(() => bankConnections.id, {
      onDelete: "cascade",
    }),
    accountId: text("account_id").notNull(),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    currency: text("currency").notNull(),
    balance: numeric("balance", { precision: 12, scale: 2 }).default("0"),
    availableBalance: numeric("available_balance", {
      precision: 12,
      scale: 2,
    }),
    creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
    iban: text("iban"),
    bic: text("bic"),
    isManual: boolean("is_manual").default(false).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("bank_accounts_space_id_idx").on(table.spaceId),
    index("bank_accounts_connection_id_idx").on(table.bankConnectionId),
    unique("unique_bank_account_per_connection").on(table.bankConnectionId, table.accountId),
  ],
);

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;
