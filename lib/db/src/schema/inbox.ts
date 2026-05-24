import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";

export const inboxTable = pgTable("inbox", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull(),
  date: text("date").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("general"),
  isRead: boolean("is_read").notNull().default(false),
});

export type InboxMessage = typeof inboxTable.$inferSelect;
export type InsertInboxMessage = typeof inboxTable.$inferInsert;
