import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const clubsTable = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  leagueId: integer("league_id").notNull(),
  reputation: integer("reputation").notNull().default(3),
  budget: integer("budget").notNull().default(50000),
  wageBudget: integer("wage_budget").notNull().default(500),
  stadiumName: text("stadium_name").notNull(),
  stadiumCapacity: integer("stadium_capacity").notNull().default(30000),
  colors: text("colors").notNull().default("#1a73e8"),
  description: text("description").notNull().default(""),
  transferIncome: integer("transfer_income").notNull().default(0),
  transferSpend: integer("transfer_spend").notNull().default(0),
  matchdayRevenue: integer("matchday_revenue").notNull().default(0),
  sponsorshipRevenue: integer("sponsorship_revenue").notNull().default(0),
});

export type Club = typeof clubsTable.$inferSelect;
export type InsertClub = typeof clubsTable.$inferInsert;
