import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const businessProfiles = sqliteTable("business_profiles", {
  ownerId: text("owner_id").primaryKey(),
  businessName: text("business_name").notNull(),
});
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  kind: text("kind").notNull(),
  amountKobo: integer("amount_kobo").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  vehicle: text("vehicle").notNull().default(""),
  trip: text("trip").notNull().default(""),
  createdAt: text("created_at").notNull(),
  deleted: integer("deleted").notNull().default(0),
}, (table) => [index("idx_transactions_owner_date").on(table.ownerId, table.date)]);
export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  month: text("month").notNull(),
  category: text("category").notNull(),
  amountKobo: integer("amount_kobo").notNull(),
}, (table) => [uniqueIndex("idx_budgets_owner_month_category").on(table.ownerId, table.month, table.category)]);

export const savingsGoals = sqliteTable("savings_goals", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  targetKobo: integer("target_kobo").notNull(),
  savedKobo: integer("saved_kobo").notNull().default(0),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_goals_owner").on(table.ownerId)]);
