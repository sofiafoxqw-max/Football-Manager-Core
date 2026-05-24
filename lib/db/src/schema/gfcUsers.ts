import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const gfcUsersTable = pgTable("gfc_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull().default(""),
  role: text("role").notNull().default("unregistered"),
  balance: integer("balance").notNull().default(10000000),
  reputation: integer("reputation").notNull().default(50),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  prizeMoneyEarned: integer("prize_money_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GfcUser = typeof gfcUsersTable.$inferSelect;
export type InsertGfcUser = typeof gfcUsersTable.$inferInsert;
