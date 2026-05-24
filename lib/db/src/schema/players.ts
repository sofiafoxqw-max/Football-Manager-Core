import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  nationality: text("nationality").notNull(),
  position: text("position").notNull(),
  overall: integer("overall").notNull(),
  potential: integer("potential").notNull(),
  pace: integer("pace").notNull().default(50),
  shooting: integer("shooting").notNull().default(50),
  passing: integer("passing").notNull().default(50),
  dribbling: integer("dribbling").notNull().default(50),
  defending: integer("defending").notNull().default(50),
  physicality: integer("physicality").notNull().default(50),
  goalkeeping: integer("goalkeeping").notNull().default(10),
  form: integer("form").notNull().default(6),
  fitness: integer("fitness").notNull().default(90),
  morale: text("morale").notNull().default("good"),
  value: integer("value").notNull().default(1000),
  weeklySalary: integer("weekly_salary").notNull().default(10),
  contractEndsYear: integer("contract_ends_year").notNull().default(2027),
  seasonGoals: integer("season_goals").notNull().default(0),
  seasonAssists: integer("season_assists").notNull().default(0),
  seasonAppearances: integer("season_appearances").notNull().default(0),
  clubId: integer("club_id").notNull(),
  isOnTransferList: boolean("is_on_transfer_list").notNull().default(false),
});

export type Player = typeof playersTable.$inferSelect;
export type InsertPlayer = typeof playersTable.$inferInsert;
