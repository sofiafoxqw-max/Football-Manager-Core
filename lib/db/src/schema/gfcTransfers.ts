import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const gfcTransferListingsTable = pgTable("gfc_transfer_listings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  fromClubId: integer("from_club_id").notNull(),
  askingPrice: integer("asking_price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  listedAt: timestamp("listed_at").notNull().defaultNow(),
});

export const gfcTransferBidsTable = pgTable("gfc_transfer_bids", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  biddingClubId: integer("bidding_club_id").notNull(),
  bidAmount: integer("bid_amount").notNull(),
  status: text("status").notNull().default("pending"),
  taxAmount: integer("tax_amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gfcTransferRecordsTable = pgTable("gfc_transfer_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  fromClubId: integer("from_club_id").notNull(),
  toClubId: integer("to_club_id").notNull(),
  fee: integer("fee").notNull(),
  taxPaid: integer("tax_paid").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type GfcTransferListing = typeof gfcTransferListingsTable.$inferSelect;
export type InsertGfcTransferListing = typeof gfcTransferListingsTable.$inferInsert;
export type GfcTransferBid = typeof gfcTransferBidsTable.$inferSelect;
export type GfcTransferRecord = typeof gfcTransferRecordsTable.$inferSelect;
