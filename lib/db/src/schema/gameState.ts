import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";

export const gameStateTable = pgTable("game_state", {
  id: serial("id").primaryKey(),
  started: boolean("started").notNull().default(false),
  clubId: integer("club_id"),
  managerName: text("manager_name"),
  currentDate: text("current_date"),
  currentWeek: integer("current_week").notNull().default(0),
  season: integer("season").notNull().default(2026),
});

export type GameState = typeof gameStateTable.$inferSelect;
export type InsertGameState = typeof gameStateTable.$inferInsert;
