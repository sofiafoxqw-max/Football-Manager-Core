import { pgTable, serial, integer, jsonb } from "drizzle-orm/pg-core";

export const setPiecesTable = pgTable("set_pieces", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull().unique(),
  routines: jsonb("routines").notNull().default([]),
});

export type SetPieces = typeof setPiecesTable.$inferSelect;
export type InsertSetPieces = typeof setPiecesTable.$inferInsert;
