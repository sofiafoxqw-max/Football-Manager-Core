import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";

export const transfersTable = pgTable("transfers", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  playerName: text("player_name").notNull(),
  fromClubId: integer("from_club_id").notNull(),
  fromClubName: text("from_club_name").notNull(),
  toClubId: integer("to_club_id").notNull(),
  toClubName: text("to_club_name").notNull(),
  fee: integer("fee").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull().default("purchase"),
});

export type Transfer = typeof transfersTable.$inferSelect;
export type InsertTransfer = typeof transfersTable.$inferInsert;
