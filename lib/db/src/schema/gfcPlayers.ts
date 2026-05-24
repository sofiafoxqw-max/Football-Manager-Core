import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";

export const gfcPlayersTable = pgTable("gfc_players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  nationality: text("nationality").notNull(),
  position: text("position").notNull(),
  overall: integer("overall").notNull(),
  potential: integer("potential").notNull(),
  pace: integer("pace").notNull(),
  shooting: integer("shooting").notNull(),
  passing: integer("passing").notNull(),
  dribbling: integer("dribbling").notNull(),
  defending: integer("defending").notNull(),
  physicality: integer("physicality").notNull(),
  value: integer("value").notNull(),
  weeklySalary: integer("weekly_salary").notNull(),
  contractEndsWeek: integer("contract_ends_week"),
  clubId: integer("club_id"),
  isOnTransferList: boolean("is_on_transfer_list").notNull().default(false),
  isFreeAgent: boolean("is_free_agent").notNull().default(true),
});

export type GfcPlayer = typeof gfcPlayersTable.$inferSelect;
export type InsertGfcPlayer = typeof gfcPlayersTable.$inferInsert;
