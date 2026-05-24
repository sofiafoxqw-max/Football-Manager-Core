import { Router } from "express";
import { db } from "@workspace/db";
import {
  gfcTransferListingsTable,
  gfcTransferBidsTable,
  gfcTransferRecordsTable,
  gfcPlayersTable,
  gfcClubsTable,
  gfcUsersTable,
  gfcTransactionsTable,
  gfcActivityTable,
  gfcContractsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../lib/requireAuth";
import { getGfcUser, getGfcClubByUser } from "./helpers";

const router = Router();
const TAX_RATE = 0.1;

router.get("/market", async (req, res) => {
  try {
    const listings = await db.select().from(gfcTransferListingsTable).where(eq(gfcTransferListingsTable.isActive, true));
    const players = await db.select().from(gfcPlayersTable);
    const clubs = await db.select().from(gfcClubsTable);
    const playerMap = new Map(players.map((p) => [p.id, p]));
    const clubMap = new Map(clubs.map((c) => [c.id, c]));

    let result = listings.map((l) => {
      const player = playerMap.get(l.playerId);
      const club = clubMap.get(l.fromClubId);
      return {
        id: l.id,
        playerId: l.playerId,
        playerName: player?.name ?? "Unknown",
        position: player?.position ?? "?",
        overall: player?.overall ?? 0,
        age: player?.age ?? 0,
        fromClubId: l.fromClubId,
        fromClubName: club?.name ?? "Unknown",
        askingPrice: l.askingPrice,
        listedAt: l.listedAt.toISOString(),
      };
    });

    const { position, maxPrice, leagueId } = req.query;
    if (position) result = result.filter((r) => r.position === position);
    if (maxPrice) result = result.filter((r) => r.askingPrice <= parseInt(maxPrice as string));

    res.json(result);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bid", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.gfcUserId);
    if (!user || user.role !== "coach") return res.status(403).json({ error: "Coaches only" });
    const club = await getGfcClubByUser(user);
    if (!club) return res.status(400).json({ error: "Not managing a club" });

    const { listingId, bidAmount } = req.body;
    const [listing] = await db.select().from(gfcTransferListingsTable).where(eq(gfcTransferListingsTable.id, listingId));
    if (!listing || !listing.isActive) return res.status(400).json({ error: "Listing not found or inactive" });
    if (listing.fromClubId === club.id) return res.status(400).json({ error: "Cannot bid on your own player" });

    const tax = Math.floor(bidAmount * TAX_RATE);
    const total = bidAmount + tax;
    if (club.transferBudget < total) return res.status(400).json({ error: "Insufficient transfer budget" });

    const [player] = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.id, listing.playerId));

    await db.update(gfcTransferListingsTable).set({ isActive: false }).where(eq(gfcTransferListingsTable.id, listingId));
    await db.update(gfcPlayersTable).set({ clubId: club.id, isFreeAgent: false, isOnTransferList: false })
      .where(eq(gfcPlayersTable.id, listing.playerId));
    await db.update(gfcClubsTable).set({ transferBudget: club.transferBudget - total })
      .where(eq(gfcClubsTable.id, club.id));

    const [fromClub] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, listing.fromClubId));
    if (fromClub) {
      await db.update(gfcClubsTable).set({ transferBudget: fromClub.transferBudget + bidAmount })
        .where(eq(gfcClubsTable.id, fromClub.id));
    }

    const [bid] = await db.insert(gfcTransferBidsTable).values({
      listingId, biddingClubId: club.id, bidAmount, status: "accepted", taxAmount: tax,
    }).returning();

    await db.insert(gfcTransferRecordsTable).values({
      playerId: listing.playerId, fromClubId: listing.fromClubId, toClubId: club.id, fee: bidAmount, taxPaid: tax,
    });

    await db.insert(gfcTransactionsTable).values({
      userId: user.id, type: "transfer_fee", amount: -total,
      description: `Transfer fee for ${player?.name ?? "player"} (incl. 10% tax)`, relatedPlayerId: listing.playerId,
    });

    await db.insert(gfcActivityTable).values({
      type: "transfer",
      description: `${player?.name ?? "Player"} transferred from ${fromClub?.name ?? "?"} to ${club.name}`,
      involvedClub: club.name, amount: bidAmount,
    });

    res.json({ id: bid.id, listingId, playerName: player?.name ?? "Unknown", bidAmount, status: "accepted", taxAmount: tax });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/list-player", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.gfcUserId);
    if (!user || user.role !== "coach") return res.status(403).json({ error: "Coaches only" });
    const club = await getGfcClubByUser(user);
    if (!club) return res.status(400).json({ error: "Not managing a club" });

    const { playerId, askingPrice } = req.body;
    const [player] = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.id, playerId));
    if (!player || player.clubId !== club.id) return res.status(400).json({ error: "Player not in your squad" });

    await db.update(gfcPlayersTable).set({ isOnTransferList: true }).where(eq(gfcPlayersTable.id, playerId));
    const [listing] = await db.insert(gfcTransferListingsTable).values({
      playerId, fromClubId: club.id, askingPrice, isActive: true,
    }).returning();

    res.json({
      id: listing.id,
      playerId: listing.playerId,
      playerName: player.name,
      position: player.position,
      overall: player.overall,
      age: player.age,
      fromClubId: listing.fromClubId,
      fromClubName: club.name,
      askingPrice: listing.askingPrice,
      listedAt: listing.listedAt.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history", async (_req, res) => {
  try {
    const records = await db.select().from(gfcTransferRecordsTable);
    const players = await db.select().from(gfcPlayersTable);
    const clubs = await db.select().from(gfcClubsTable);
    const playerMap = new Map(players.map((p) => [p.id, p.name]));
    const clubMap = new Map(clubs.map((c) => [c.id, c.name]));

    res.json(records.map((r) => ({
      id: r.id,
      playerName: playerMap.get(r.playerId) ?? "Unknown",
      fromClubName: clubMap.get(r.fromClubId) ?? "Unknown",
      toClubName: clubMap.get(r.toClubId) ?? "Unknown",
      fee: r.fee,
      taxPaid: r.taxPaid,
      completedAt: r.completedAt.toISOString(),
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
