import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const gfcClubsTable = pgTable("gfc_clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leagueId: integer("league_id").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  colors: text("colors").notNull().default("#1a1a2e,#e94560"),
  stadiumName: text("stadium_name").notNull(),
  stadiumCapacity: integer("stadium_capacity").notNull().default(20000),
  description: text("description").notNull().default(""),
  purchasePrice: integer("purchase_price").notNull().default(5000000),
  currentValue: integer("current_value").notNull().default(5000000),
  prestige: integer("prestige").notNull().default(50),
  ownerId: text("owner_id"),
  coachId: text("coach_id"),
  stadiumLevel: integer("stadium_level").notNull().default(1),
  academyLevel: integer("academy_level").notNull().default(1),
  trainingLevel: integer("training_level").notNull().default(1),
  transferBudget: integer("transfer_budget").notNull().default(2000000),
  weeklyWageBill: integer("weekly_wage_bill").notNull().default(0),
  coachSalary: integer("coach_salary"),
  coachContractWeeks: integer("coach_contract_weeks"),
  won: integer("won").notNull().default(0),
  drawn: integer("drawn").notNull().default(0),
  lost: integer("lost").notNull().default(0),
  goalsFor: integer("goals_for").notNull().default(0),
  goalsAgainst: integer("goals_against").notNull().default(0),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GfcClub = typeof gfcClubsTable.$inferSelect;
export type InsertGfcClub = typeof gfcClubsTable.$inferInsert;
