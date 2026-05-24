import { pgTable, serial, integer, text, jsonb } from "drizzle-orm/pg-core";

export const fixturesTable = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull(),
  week: integer("week").notNull(),
  date: text("date").notNull(),
  homeClubId: integer("home_club_id").notNull(),
  awayClubId: integer("away_club_id").notNull(),
  status: text("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  events: jsonb("events").notNull().default([]),
  homePossession: integer("home_possession"),
  awayPossession: integer("away_possession"),
  homeShots: integer("home_shots"),
  awayShots: integer("away_shots"),
  homeShotsOnTarget: integer("home_shots_on_target"),
  awayShotsOnTarget: integer("away_shots_on_target"),
  homeCorners: integer("home_corners"),
  awayCorners: integer("away_corners"),
});

export type Fixture = typeof fixturesTable.$inferSelect;
export type InsertFixture = typeof fixturesTable.$inferInsert;
