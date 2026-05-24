import { Router } from "express";
import { db } from "@workspace/db";
import {
  gfcClubsTable,
  gfcLeaguesTable,
  gfcUsersTable,
  gfcPlayersTable,
  gfcCoachOffersTable,
  gfcTransactionsTable,
  gfcActivityTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../lib/requireAuth";
import { getGfcUser, getGfcClubByUser } from "./helpers";
import { randomUUID } from "crypto";

const router = Router();

const UPGRADE_COST = { stadium: 2000000, academy: 1500000, training: 1000000 };
const TAX_RATE = 0.1;

async function buildClubDetail(club: any, league: any) {
  const players = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.clubId, club.id));
  let ownerName: string | null = null;
  let coachName: string | null = null;
  if (club.ownerId) {
    const [owner] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.id, club.ownerId));
    ownerName = owner?.displayName ?? null;
  }
  if (club.coachId) {
    const [coach] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.id, club.coachId));
    coachName = coach?.displayName ?? null;
  }
  return {
    id: club.id,
    name: club.name,
    leagueId: club.leagueId,
    leagueName: league?.name ?? "Unknown",
    country: club.country,
    city: club.city,
    colors: club.colors,
    purchasePrice: club.purchasePrice,
    currentValue: club.currentValue,
    prestige: club.prestige,
    ownerId: club.ownerId,
    ownerName,
    coachId: club.coachId,
    coachName,
    stadiumLevel: club.stadiumLevel,
    academyLevel: club.academyLevel,
    trainingLevel: club.trainingLevel,
    transferBudget: club.transferBudget,
    weeklyWageBill: club.weeklyWageBill,
    stadiumName: club.stadiumName,
    stadiumCapacity: club.stadiumCapacity,
    description: club.description,
    players: players.map((p) => ({
      id: p.id, name: p.name, age: p.age, nationality: p.nationality,
      position: p.position, overall: p.overall, potential: p.potential,
      pace: p.pace, shooting: p.shooting, passing: p.passing,
      dribbling: p.dribbling, defending: p.defending, physicality: p.physicality,
      value: p.value, weeklySalary: p.weeklySalary, contractEndsWeek: p.contractEndsWeek,
      clubId: p.clubId, clubName: club.name, isOnTransferList: p.isOnTransferList, isFreeAgent: p.isFreeAgent,
    })),
    coachSalary: club.coachSalary,
    coachContractWeeks: club.coachContractWeeks,
  };
}

router.get("/", async (req, res) => {
  try {
    const { leagueId, available } = req.query;
    let clubs = await db.select().from(gfcClubsTable);
    if (leagueId) clubs = clubs.filter((c) => c.leagueId === parseInt(leagueId as string));
    if (available === "true") clubs = clubs.filter((c) => !c.ownerId);
    const leagues = await db.select().from(gfcLeaguesTable);
    const leagueMap = new Map(leagues.map((l) => [l.id, l.name]));
    const users = await db.select().from(gfcUsersTable);
    const userMap = new Map(users.map((u) => [u.id, u.displayName]));

    res.json(clubs.map((c) => ({
      id: c.id,
      name: c.name,
      leagueId: c.leagueId,
      leagueName: leagueMap.get(c.leagueId) ?? "Unknown",
      country: c.country,
      city: c.city,
      colors: c.colors,
      purchasePrice: c.purchasePrice,
      currentValue: c.currentValue,
      prestige: c.prestige,
      ownerId: c.ownerId,
      ownerName: c.ownerId ? (userMap.get(c.ownerId) ?? null) : null,
      coachId: c.coachId,
      coachName: c.coachId ? (userMap.get(c.coachId) ?? null) : null,
      stadiumLevel: c.stadiumLevel,
      academyLevel: c.academyLevel,
      trainingLevel: c.trainingLevel,
      transferBudget: c.transferBudget,
      weeklyWageBill: c.weeklyWageBill,
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user) return res.status(404).json({ error: "Not registered" });
    const club = await getGfcClubByUser(user);
    if (!club) return res.status(404).json({ error: "No club found" });
    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
    res.json(await buildClubDetail(club, league));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, id));
    if (!club) return res.status(404).json({ error: "Club not found" });
    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
    res.json(await buildClubDetail(club, league));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/buy", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "owner") return res.status(403).json({ error: "Owners only" });
    const clubId = parseInt(req.params.id);
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    if (!club) return res.status(404).json({ error: "Club not found" });
    if (club.ownerId) return res.status(400).json({ error: "Club already owned" });

    const alreadyOwns = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.ownerId, user.id));
    if (alreadyOwns.length > 0) return res.status(400).json({ error: "You already own a club" });

    if (user.balance < club.purchasePrice) return res.status(400).json({ error: "Insufficient funds" });

    const tax = Math.floor(club.purchasePrice * TAX_RATE);
    const total = club.purchasePrice + tax;
    if (user.balance < total) return res.status(400).json({ error: "Insufficient funds (including tax)" });

    await db.update(gfcUsersTable).set({ balance: user.balance - total, totalSpent: user.totalSpent + total })
      .where(eq(gfcUsersTable.id, user.id));
    await db.update(gfcClubsTable).set({ ownerId: user.id }).where(eq(gfcClubsTable.id, clubId));
    await db.insert(gfcTransactionsTable).values({
      userId: user.id, type: "club_purchase",
      amount: -total, description: `Purchased ${club.name} (incl. 10% tax)`, relatedClubId: clubId,
    });
    await db.insert(gfcActivityTable).values({
      type: "club_sale", description: `${user.displayName} purchased ${club.name}`,
      involvedClub: club.name, amount: club.purchasePrice,
    });

    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
    const [updatedClub] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    res.json(await buildClubDetail(updatedClub, league));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/hire-coach", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "owner") return res.status(403).json({ error: "Owners only" });
    const clubId = parseInt(req.params.id);
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    if (!club || club.ownerId !== user.id) return res.status(403).json({ error: "Not your club" });
    if (club.coachId) return res.status(400).json({ error: "Club already has a coach" });

    const { coachUserId, weeklySalary, contractWeeks, bonusPerWin } = req.body;
    const [targetCoach] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.id, coachUserId));
    if (!targetCoach || targetCoach.role !== "coach") return res.status(400).json({ error: "Target user is not a coach" });

    await db.insert(gfcCoachOffersTable).values({
      ownerId: user.id, coachUserId, clubId,
      weeklySalary, contractWeeks, bonusPerWin: bonusPerWin ?? 0, status: "pending",
    });

    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
    res.json(await buildClubDetail(club, league));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/fire-coach", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "owner") return res.status(403).json({ error: "Owners only" });
    const clubId = parseInt(req.params.id);
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    if (!club || club.ownerId !== user.id) return res.status(403).json({ error: "Not your club" });

    await db.update(gfcClubsTable).set({ coachId: null, coachSalary: null, coachContractWeeks: null })
      .where(eq(gfcClubsTable.id, clubId));

    await db.insert(gfcActivityTable).values({
      type: "coach_fired", description: `Coach fired from ${club.name}`, involvedClub: club.name,
    });

    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
    const [updatedClub] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    res.json(await buildClubDetail(updatedClub, league));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/upgrade", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role !== "owner") return res.status(403).json({ error: "Owners only" });
    const clubId = parseInt(req.params.id);
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    if (!club || club.ownerId !== user.id) return res.status(403).json({ error: "Not your club" });

    const { upgradeType } = req.body;
    const cost = UPGRADE_COST[upgradeType as keyof typeof UPGRADE_COST];
    if (!cost) return res.status(400).json({ error: "Invalid upgrade type" });
    if (user.balance < cost) return res.status(400).json({ error: "Insufficient funds" });

    const levelField = `${upgradeType}Level` as keyof typeof club;
    const currentLevel = club[levelField] as number;
    if (currentLevel >= 5) return res.status(400).json({ error: "Already at max level" });

    await db.update(gfcUsersTable).set({ balance: user.balance - cost, totalSpent: user.totalSpent + cost })
      .where(eq(gfcUsersTable.id, user.id));

    const updateData: any = {};
    updateData[`${upgradeType}Level`] = currentLevel + 1;
    if (upgradeType === "stadium") {
      updateData.stadiumCapacity = club.stadiumCapacity + 5000;
      updateData.currentValue = club.currentValue + cost;
    }
    await db.update(gfcClubsTable).set(updateData).where(eq(gfcClubsTable.id, clubId));

    await db.insert(gfcTransactionsTable).values({
      userId: user.id, type: "upgrade", amount: -cost,
      description: `Upgraded ${upgradeType} at ${club.name}`, relatedClubId: clubId,
    });
    await db.insert(gfcActivityTable).values({
      type: "upgrade", description: `${club.name} upgraded ${upgradeType} to level ${currentLevel + 1}`,
      involvedClub: club.name, amount: cost,
    });

    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
    const [updatedClub] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, clubId));
    res.json(await buildClubDetail(updatedClub, league));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
