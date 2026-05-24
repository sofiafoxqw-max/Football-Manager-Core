import { Router } from "express";
import { db } from "@workspace/db";
import { clubsTable, leaguesTable, gameStateTable, playersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { computeStandings } from "./game";

const router = Router();

router.get("/league", async (_req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  const [league] = await db.select().from(leaguesTable).limit(1);
  if (!league) return res.status(404).json({ error: "League not found" });

  const allClubs = await db.select().from(clubsTable).where(eq(clubsTable.leagueId, league.id));
  const standings = await computeStandings(allClubs.map(c => c.id), league.id, state?.currentWeek ?? 0);

  const clubMap = Object.fromEntries(allClubs.map(c => [c.id, c.name]));

  return res.json({
    leagueName: league.name,
    season: league.season,
    currentWeek: state?.currentWeek ?? 0,
    standings: standings.map(s => ({
      position: s.position,
      clubId: s.clubId,
      clubName: clubMap[s.clubId] ?? "Unknown",
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.gf,
      goalsAgainst: s.ga,
      goalDifference: s.gf - s.ga,
      points: s.points,
      isPlayerClub: s.clubId === (state?.clubId ?? 0),
      form: s.recentResults.slice(0, 5),
    })),
  });
});

router.get("/stats/season", async (_req, res) => {
  const topScorers = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      clubId: playersTable.clubId,
      position: playersTable.position,
      goals: playersTable.seasonGoals,
      assists: playersTable.seasonAssists,
      appearances: playersTable.seasonAppearances,
    })
    .from(playersTable)
    .orderBy(desc(playersTable.seasonGoals))
    .limit(10);

  const topAssisters = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      clubId: playersTable.clubId,
      position: playersTable.position,
      goals: playersTable.seasonGoals,
      assists: playersTable.seasonAssists,
      appearances: playersTable.seasonAppearances,
    })
    .from(playersTable)
    .orderBy(desc(playersTable.seasonAssists))
    .limit(10);

  const allClubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(allClubs.map(c => [c.id, c.name]));

  const format = (p: typeof topScorers[0]) => ({
    playerId: p.id,
    playerName: p.name,
    clubName: clubMap[p.clubId] ?? "Unknown",
    position: p.position,
    goals: p.goals,
    assists: p.assists,
    appearances: p.appearances,
  });

  return res.json({
    topScorers: topScorers.map(format),
    topAssisters: topAssisters.map(format),
  });
});

export default router;
