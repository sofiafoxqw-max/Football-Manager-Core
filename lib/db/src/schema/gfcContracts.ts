import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const gfcContractsTable = pgTable("gfc_contracts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  playerId: integer("player_id"),
  coachId: text("coach_id"),
  clubId: integer("club_id").notNull(),
  weeklySalary: integer("weekly_salary").notNull(),
  startWeek: integer("start_week").notNull().default(1),
  endWeek: integer("end_week").notNull(),
  buyoutClause: integer("buyout_clause").notNull().default(0),
  status: text("status").notNull().default("active"),
  bonusPerWin: integer("bonus_per_win").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gfcCoachOffersTable = pgTable("gfc_coach_offers", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  coachUserId: text("coach_user_id").notNull(),
  clubId: integer("club_id").notNull(),
  weeklySalary: integer("weekly_salary").notNull(),
  contractWeeks: integer("contract_weeks").notNull(),
  bonusPerWin: integer("bonus_per_win").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GfcContract = typeof gfcContractsTable.$inferSelect;
export type InsertGfcContract = typeof gfcContractsTable.$inferInsert;
export type GfcCoachOffer = typeof gfcCoachOffersTable.$inferSelect;
export type InsertGfcCoachOffer = typeof gfcCoachOffersTable.$inferInsert;
