import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const gfcTransactionsTable = pgTable("gfc_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  relatedClubId: integer("related_club_id"),
  relatedPlayerId: integer("related_player_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gfcActivityTable = pgTable("gfc_activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  involvedClub: text("involved_club"),
  amount: integer("amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GfcTransaction = typeof gfcTransactionsTable.$inferSelect;
export type InsertGfcTransaction = typeof gfcTransactionsTable.$inferInsert;
export type GfcActivity = typeof gfcActivityTable.$inferSelect;
