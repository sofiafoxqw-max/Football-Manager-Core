import { pgTable, serial, integer, text, jsonb } from "drizzle-orm/pg-core";

export const trainingTable = pgTable("training", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().unique(),
  schedule: jsonb("schedule").notNull().default([]),
  teamFocus: text("team_focus").notNull().default("balanced"),
});

export type Training = typeof trainingTable.$inferSelect;
export type InsertTraining = typeof trainingTable.$inferInsert;
