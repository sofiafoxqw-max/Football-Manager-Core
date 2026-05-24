import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";

export const shortlistTable = pgTable("shortlist", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull(),
  playerId: integer("player_id").notNull(),
  notes: text("notes"),
  dateAdded: text("date_added").notNull(),
});

export type Shortlist = typeof shortlistTable.$inferSelect;
export type InsertShortlist = typeof shortlistTable.$inferInsert;
