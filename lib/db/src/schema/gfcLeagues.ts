import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const gfcLeaguesTable = pgTable("gfc_leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  tier: integer("tier").notNull().default(1),
  season: integer("season").notNull().default(2026),
  currentWeek: integer("current_week").notNull().default(1),
  totalWeeks: integer("total_weeks").notNull().default(38),
  entryFee: integer("entry_fee").notNull().default(0),
  prizePool: integer("prize_pool").notNull().default(5000000),
});

export type GfcLeague = typeof gfcLeaguesTable.$inferSelect;
export type InsertGfcLeague = typeof gfcLeaguesTable.$inferInsert;
