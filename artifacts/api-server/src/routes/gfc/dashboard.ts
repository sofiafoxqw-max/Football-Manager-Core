import { Router } from "express";
import { db } from "@workspace/db";
import {
  gfcUsersTable,
  gfcClubsTable,
  gfcLeaguesTable,
  gfcPlayersTable,
  gfcActivityTable,
  gfcCoachOffersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../../lib/requireAuth";
import { getGfcUser, getGfcClubByUser } from "./helpers";

const router = Router();

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.clerkUserId);
    if (!user || user.role === "unregistered") return res.status(403).json({ error: "Not registered" });

    const club = await getGfcClubByUser(user);
    let leagueName: string | null = null;
    let leaguePosition: number | null = null;
    let points: number | null = null;
    let squadSize: number | null = null;

    if (club) {
      const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, club.leagueId));
      leagueName = league?.name ?? null;
      points = club.points;

      const allClubs = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.leagueId, club.leagueId));
      const sorted = [...allClubs].sort((a, b) => b.points - a.points);
      leaguePosition = sorted.findIndex((c) => c.id === club.id) + 1;

      const players = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.clubId, club.id));
      squadSize = players.length;
    }

    const pendingOffers = user.role === "coach"
      ? (await db.select().from(gfcCoachOffersTable).where(eq(gfcCoachOffersTable.coachUserId, user.id))).filter((o) => o.status === "pending").length
      : 0;

    res.json({
      role: user.role,
      displayName: user.displayName,
      balance: user.balance,
      reputation: user.reputation,
      clubId: club?.id ?? null,
      clubName: club?.name ?? null,
      leagueName,
      leaguePosition,
      points,
      clubValue: club?.currentValue ?? null,
      transferBudget: club?.transferBudget ?? null,
      squadSize,
      weeklyWageBill: club?.weeklyWageBill ?? null,
      pendingOffers,
      hasClub: !!club,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity", async (_req, res) => {
  try {
    const activities = await db.select().from(gfcActivityTable)
      .orderBy(desc(gfcActivityTable.createdAt)).limit(30);
    res.json(activities.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      involvedClub: a.involvedClub,
      amount: a.amount,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard", async (_req, res) => {
  try {
    const users = await db.select().from(gfcUsersTable);
    const clubs = await db.select().from(gfcClubsTable);
    const clubByOwner = new Map(clubs.filter((c) => c.ownerId).map((c) => [c.ownerId!, c]));
    const clubByCoach = new Map(clubs.filter((c) => c.coachId).map((c) => [c.coachId!, c]));

    const owners = users.filter((u) => u.role === "owner")
      .sort((a, b) => (clubByOwner.get(b.id)?.currentValue ?? 0) - (clubByOwner.get(a.id)?.currentValue ?? 0))
      .slice(0, 10)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        displayName: u.displayName,
        clubName: clubByOwner.get(u.id)?.name ?? null,
        score: clubByOwner.get(u.id)?.currentValue ?? 0,
        scoreLabel: "Club Value",
      }));

    const coaches = users.filter((u) => u.role === "coach")
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 10)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        displayName: u.displayName,
        clubName: clubByCoach.get(u.id)?.name ?? null,
        score: u.reputation,
        scoreLabel: "Reputation",
      }));

    res.json({ topOwners: owners, topCoaches: coaches });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
