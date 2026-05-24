import { Router } from "express";
import { db } from "@workspace/db";
import {
  gfcContractsTable,
  gfcCoachOffersTable,
  gfcClubsTable,
  gfcPlayersTable,
  gfcUsersTable,
  gfcTransactionsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../lib/requireAuth";
import { getGfcUser, getGfcClubByUser } from "./helpers";

const router = Router();

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user) return res.status(404).json({ error: "User not registered" });
    const club = await getGfcClubByUser(user);
    if (!club) return res.json([]);

    const contracts = await db.select().from(gfcContractsTable)
      .where(and(eq(gfcContractsTable.clubId, club.id), eq(gfcContractsTable.status, "active")));

    const players = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.clubId, club.id));
    const playerMap = new Map(players.map((p) => [p.id, p.name]));

    res.json(contracts.map((c) => ({
      id: c.id,
      type: c.type,
      playerId: c.playerId,
      playerName: c.playerId ? (playerMap.get(c.playerId) ?? null) : null,
      coachId: c.coachId,
      coachName: null,
      clubId: c.clubId,
      clubName: club.name,
      weeklySalary: c.weeklySalary,
      startWeek: c.startWeek,
      endWeek: c.endWeek,
      buyoutClause: c.buyoutClause,
      status: c.status,
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coach-offers", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "coach") return res.status(403).json({ error: "Coaches only" });
    const offers = await db.select().from(gfcCoachOffersTable)
      .where(eq(gfcCoachOffersTable.coachUserId, user.id));
    const clubs = await db.select().from(gfcClubsTable);
    const clubMap = new Map(clubs.map((c) => [c.id, c]));
    const owners = await db.select().from(gfcUsersTable);
    const ownerMap = new Map(owners.map((u) => [u.id, u.displayName]));

    res.json(offers.map((o) => {
      const club = clubMap.get(o.clubId);
      return {
        id: o.id,
        ownerName: ownerMap.get(o.ownerId) ?? "Unknown",
        clubId: o.clubId,
        clubName: club?.name ?? "Unknown",
        leagueName: "Unknown",
        weeklySalary: o.weeklySalary,
        contractWeeks: o.contractWeeks,
        bonusPerWin: o.bonusPerWin,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      };
    }));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coach-offers/:id/respond", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "coach") return res.status(403).json({ error: "Coaches only" });
    const offerId = parseInt(req.params.id);
    const { accept } = req.body;
    const [offer] = await db.select().from(gfcCoachOffersTable).where(eq(gfcCoachOffersTable.id, offerId));
    if (!offer || offer.coachUserId !== user.id) return res.status(404).json({ error: "Offer not found" });
    if (offer.status !== "pending") return res.status(400).json({ error: "Offer already responded to" });

    const newStatus = accept ? "accepted" : "rejected";
    const [updated] = await db.update(gfcCoachOffersTable)
      .set({ status: newStatus })
      .where(eq(gfcCoachOffersTable.id, offerId))
      .returning();

    if (accept) {
      const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, offer.clubId));
      if (club) {
        await db.update(gfcClubsTable).set({
          coachId: user.id,
          coachSalary: offer.weeklySalary,
          coachContractWeeks: offer.contractWeeks,
        }).where(eq(gfcClubsTable.id, offer.clubId));
      }
    }

    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/player", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "coach") return res.status(403).json({ error: "Coaches only" });
    const club = await getGfcClubByUser(user);
    if (!club) return res.status(400).json({ error: "Not managing a club" });
    const { playerId, weeklySalary, contractWeeks } = req.body;
    const [player] = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.id, playerId));
    if (!player || !player.isFreeAgent) return res.status(400).json({ error: "Player not available" });

    const startWeek = 1;
    const endWeek = startWeek + contractWeeks;
    const [contract] = await db.insert(gfcContractsTable).values({
      type: "player",
      playerId,
      clubId: club.id,
      weeklySalary,
      startWeek,
      endWeek,
      buyoutClause: weeklySalary * contractWeeks * 2,
      status: "active",
    }).returning();

    await db.update(gfcPlayersTable).set({ clubId: club.id, isFreeAgent: false, contractEndsWeek: endWeek })
      .where(eq(gfcPlayersTable.id, playerId));
    await db.update(gfcClubsTable).set({ weeklyWageBill: (club.weeklyWageBill ?? 0) + weeklySalary })
      .where(eq(gfcClubsTable.id, club.id));

    res.status(201).json({
      id: contract.id,
      type: contract.type,
      playerId: contract.playerId,
      playerName: player.name,
      coachId: null,
      coachName: null,
      clubId: contract.clubId,
      clubName: club.name,
      weeklySalary: contract.weeklySalary,
      startWeek: contract.startWeek,
      endWeek: contract.endWeek,
      buyoutClause: contract.buyoutClause,
      status: contract.status,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/terminate", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user) return res.status(401).json({ error: "Not registered" });
    const contractId = parseInt(req.params.id);
    const [contract] = await db.select().from(gfcContractsTable).where(eq(gfcContractsTable.id, contractId));
    if (!contract || contract.status !== "active") return res.status(404).json({ error: "Contract not found" });

    await db.update(gfcContractsTable).set({ status: "terminated" }).where(eq(gfcContractsTable.id, contractId));
    if (contract.playerId) {
      await db.update(gfcPlayersTable).set({ clubId: null, isFreeAgent: true, contractEndsWeek: null })
        .where(eq(gfcPlayersTable.id, contract.playerId));
    }
    res.json({ success: true, message: "Contract terminated" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
