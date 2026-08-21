import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const spaces = pgTable("spaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const spaceMembers = pgTable(
  "space_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("space_members_space_id_user_id_uidx").on(table.spaceId, table.userId),
    index("space_members_space_id_idx").on(table.spaceId),
    index("space_members_user_id_idx").on(table.userId),
  ],
);

export type Space = typeof spaces.$inferSelect;
export type InsertSpace = typeof spaces.$inferInsert;
export type SpaceMember = typeof spaceMembers.$inferSelect;
export type InsertSpaceMember = typeof spaceMembers.$inferInsert;
