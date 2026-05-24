import { pgTable, serial, integer, text, jsonb } from "drizzle-orm/pg-core";

export const tacticsTable = pgTable("tactics", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().unique(),
  formation: text("formation").notNull().default("4-3-3"),
  mentality: text("mentality").notNull().default("balanced"),
  pressing: integer("pressing").notNull().default(5),
  tempo: integer("tempo").notNull().default(5),
  width: integer("width").notNull().default(5),
  captainId: integer("captain_id"),
  startingXI: jsonb("starting_xi").notNull().default([]),
});

export type Tactic = typeof tacticsTable.$inferSelect;
export type InsertTactic = typeof tacticsTable.$inferInsert;
