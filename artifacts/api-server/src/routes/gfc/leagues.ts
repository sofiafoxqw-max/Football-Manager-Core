import { Router } from "express";
import { db } from "@workspace/db";
import { gfcLeaguesTable, gfcClubsTable, gfcUsersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const leagues = await db.select().from(gfcLeaguesTable);
    const clubs = await db.select().from(gfcClubsTable);
    const result = leagues.map((l) => {
      const leagueClubs = clubs.filter((c) => c.leagueId === l.id);
      return {
        id: l.id,
        name: l.name,
        country: l.country,
        tier: l.tier,
        entryFee: l.entryFee,
        prizePool: l.prizePool,
        totalClubs: leagueClubs.length,
        activeOwners: leagueClubs.filter((c) => c.ownerId !== null).length,
      };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [league] = await db.select().from(gfcLeaguesTable).where(eq(gfcLeaguesTable.id, id));
    if (!league) return res.status(404).json({ error: "League not found" });
    const clubs = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.leagueId, id));
    const clubsData = clubs.map((c) => ({
      id: c.id,
      name: c.name,
      leagueId: c.leagueId,
      leagueName: league.name,
      country: c.country,
      city: c.city,
      colors: c.colors,
      purchasePrice: c.purchasePrice,
      currentValue: c.currentValue,
      prestige: c.prestige,
      ownerId: c.ownerId,
      ownerName: null,
      coachId: c.coachId,
      coachName: null,
      stadiumLevel: c.stadiumLevel,
      academyLevel: c.academyLevel,
      trainingLevel: c.trainingLevel,
      transferBudget: c.transferBudget,
      weeklyWageBill: c.weeklyWageBill,
    }));
    res.json({
      id: league.id,
      name: league.name,
      country: league.country,
      tier: league.tier,
      entryFee: league.entryFee,
      prizePool: league.prizePool,
      season: league.season,
      currentWeek: league.currentWeek,
      totalWeeks: league.totalWeeks,
      clubs: clubsData,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/standings", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const clubs = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.leagueId, id));
    const sorted = [...clubs].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
    const rows = sorted.map((c, i) => {
      const played = c.won + c.drawn + c.lost;
      return {
        position: i + 1,
        clubId: c.id,
        clubName: c.name,
        ownerName: null as string | null,
        coachName: null as string | null,
        played,
        won: c.won,
        drawn: c.drawn,
        lost: c.lost,
        goalsFor: c.goalsFor,
        goalsAgainst: c.goalsAgainst,
        points: c.points,
      };
    });
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
