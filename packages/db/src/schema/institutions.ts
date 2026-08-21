import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Matches @floos/banking Institution.provider */
export const bankProviderEnum = pgEnum("bank_provider", ["gocardless", "enablebanking"]);

/**
 * Global bank catalog (not per-space).
 * Seeded from Provider.getInstitutions — not fetched on every keystroke.
 */
export const institutions = pgTable(
  "institutions",
  {
    /** Provider-native (GC) or synthesized (EB), e.g. NORDEA_FI_PERSONAL */
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    logo: text("logo"),
    provider: bankProviderEnum("provider").notNull(),
    /** ISO-2 codes, e.g. ["SE","FI"] */
    countries: text("countries").array().notNull(),
    availableHistory: integer("available_history"),
    psuType: text("psu_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("institutions_countries_idx").using("gin", table.countries)],
);

export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = typeof institutions.$inferInsert;
