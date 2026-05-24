import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  nationality: text("nationality").notNull(),
  rating: integer("rating").notNull().default(5),
  speciality: text("speciality").notNull().default(""),
  weeklySalary: integer("weekly_salary").notNull().default(1000),
  isHired: boolean("is_hired").notNull().default(false),
  clubId: integer("club_id"),
});

export type Staff = typeof staffTable.$inferSelect;
export type InsertStaff = typeof staffTable.$inferInsert;
