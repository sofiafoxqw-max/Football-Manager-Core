import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const leaguesTable = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  season: integer("season").notNull().default(2026),
  totalWeeks: integer("total_weeks").notNull().default(38),
});

export type League = typeof leaguesTable.$inferSelect;
export type InsertLeague = typeof leaguesTable.$inferInsert;
