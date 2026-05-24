import { Router } from "express";
import { db } from "@workspace/db";
import {
  fixturesTable, gameStateTable, clubsTable, playersTable, tacticsTable, inboxTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { GetFixtureParams, SimulateMatchParams, ListFixturesQueryParams } from "@workspace/api-zod";
import { calcClubStrength, simulateMatchResult, getWeekDate } from "../lib/gameEngine";

const router = Router();

function formatFixture(f: typeof fixturesTable.$inferSelect, playerClubId: number) {
  return {
    id: f.id,
    week: f.week,
    date: f.date,
    homeClubId: f.homeClubId,
    homeClubName: "",
    awayClubId: f.awayClubId,
    awayClubName: "",
    status: f.status,
    homeScore: f.homeScore ?? null,
    awayScore: f.awayScore ?? null,
    isPlayerClubHome: f.homeClubId === playerClubId,
    isPlayerClubAway: f.awayClubId === playerClubId,
  };
}

router.get("/fixtures", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const qp = ListFixturesQueryParams.safeParse(req.query);
  const statusFilter = qp.success ? qp.data.status : undefined;

  let query = db.select().from(fixturesTable).orderBy(asc(fixturesTable.week));

  const fixtures = await query;

  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));

  const filtered = statusFilter ? fixtures.filter(f => f.status === statusFilter) : fixtures;

  return res.json(filtered.map(f => ({
    ...formatFixture(f, state.clubId!),
    homeClubName: clubMap[f.homeClubId] ?? "Unknown",
    awayClubName: clubMap[f.awayClubId] ?? "Unknown",
  })));
});

router.get("/fixtures/:id", async (req, res) => {
  const parse = GetFixtureParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid fixture id" });

  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const [fixture] = await db.select().from(fixturesTable).where(eq(fixturesTable.id, parse.data.id));
  if (!fixture) return res.status(404).json({ error: "Fixture not found" });

  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));

  const events = (fixture.events as Array<{
    minute: number;
    type: string;
    clubId: number;
    playerId: number | null;
    playerName: string;
    assistPlayerId: number | null;
    assistPlayerName: string | null;
  }>) || [];

  const stats = fixture.status === "completed" ? {
    homePossession: fixture.homePossession ?? 50,
    awayPossession: fixture.awayPossession ?? 50,
    homeShots: fixture.homeShots ?? 0,
    awayShots: fixture.awayShots ?? 0,
    homeShotsOnTarget: fixture.homeShotsOnTarget ?? 0,
    awayShotsOnTarget: fixture.awayShotsOnTarget ?? 0,
    homeCorners: fixture.homeCorners ?? 0,
    awayCorners: fixture.awayCorners ?? 0,
  } : {
    homePossession: 50,
    awayPossession: 50,
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homeCorners: 0,
    awayCorners: 0,
  };

  return res.json({
    id: fixture.id,
    week: fixture.week,
    date: fixture.date,
    homeClubId: fixture.homeClubId,
    homeClubName: clubMap[fixture.homeClubId] ?? "Unknown",
    awayClubId: fixture.awayClubId,
    awayClubName: clubMap[fixture.awayClubId] ?? "Unknown",
    status: fixture.status,
    homeScore: fixture.homeScore ?? null,
    awayScore: fixture.awayScore ?? null,
    isPlayerClubHome: fixture.homeClubId === state.clubId,
    isPlayerClubAway: fixture.awayClubId === state.clubId,
    events,
    stats,
  });
});

router.post("/fixtures/:id/simulate", async (req, res) => {
  const parse = SimulateMatchParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid fixture id" });

  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const [fixture] = await db.select().from(fixturesTable).where(eq(fixturesTable.id, parse.data.id));
  if (!fixture) return res.status(404).json({ error: "Fixture not found" });
  if (fixture.status === "completed") return res.status(400).json({ error: "Match already played" });

  // Get players for both clubs
  const [homePlayers, awayPlayers] = await Promise.all([
    db.select({ id: playersTable.id, name: playersTable.name, overall: playersTable.overall, position: playersTable.position, fitness: playersTable.fitness, form: playersTable.form })
      .from(playersTable).where(eq(playersTable.clubId, fixture.homeClubId)),
    db.select({ id: playersTable.id, name: playersTable.name, overall: playersTable.overall, position: playersTable.position, fitness: playersTable.fitness, form: playersTable.form })
      .from(playersTable).where(eq(playersTable.clubId, fixture.awayClubId)),
  ]);

  // Apply tactics modifier for player's club
  let homeStrength = calcClubStrength(homePlayers);
  let awayStrength = calcClubStrength(awayPlayers);

  if (fixture.homeClubId === state.clubId) {
    const [tactic] = await db.select().from(tacticsTable).where(eq(tacticsTable.clubId, state.clubId));
    if (tactic) {
      const mentalityBonus = { attacking: 2, gegenpressing: 1, balanced: 0, defensive: -1 }[tactic.mentality] ?? 0;
      homeStrength += mentalityBonus;
    }
  } else if (fixture.awayClubId === state.clubId) {
    const [tactic] = await db.select().from(tacticsTable).where(eq(tacticsTable.clubId, state.clubId));
    if (tactic) {
      const mentalityBonus = { attacking: 2, gegenpressing: 1, balanced: 0, defensive: -1 }[tactic.mentality] ?? 0;
      awayStrength += mentalityBonus;
    }
  }

  const result = simulateMatchResult(
    homeStrength, awayStrength,
    fixture.homeClubId, fixture.awayClubId,
    homePlayers, awayPlayers,
  );

  // Save result
  await db.update(fixturesTable).set({
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    events: result.events,
    status: "completed",
    homePossession: result.stats.homePossession,
    awayPossession: result.stats.awayPossession,
    homeShots: result.stats.homeShots,
    awayShots: result.stats.awayShots,
    homeShotsOnTarget: result.stats.homeShotsOnTarget,
    awayShotsOnTarget: result.stats.awayShotsOnTarget,
    homeCorners: result.stats.homeCorners,
    awayCorners: result.stats.awayCorners,
  }).where(eq(fixturesTable.id, fixture.id));

  // Update player stats (goals/assists)
  for (const event of result.events) {
    if (event.type === "goal" && event.playerId) {
      const [p] = await db.select({ seasonGoals: playersTable.seasonGoals, seasonAppearances: playersTable.seasonAppearances })
        .from(playersTable).where(eq(playersTable.id, event.playerId));
      if (p) await db.update(playersTable).set({ seasonGoals: p.seasonGoals + 1 }).where(eq(playersTable.id, event.playerId));
    }
    if (event.assistPlayerId) {
      const [p] = await db.select({ seasonAssists: playersTable.seasonAssists })
        .from(playersTable).where(eq(playersTable.id, event.assistPlayerId));
      if (p) await db.update(playersTable).set({ seasonAssists: p.seasonAssists + 1 }).where(eq(playersTable.id, event.assistPlayerId));
    }
  }

  // Update appearances & reduce fitness for player's club starters
  const playerClubPlayers = fixture.homeClubId === state.clubId ? homePlayers : awayPlayers;
  for (const p of playerClubPlayers.slice(0, 11)) {
    const [current] = await db.select({ seasonAppearances: playersTable.seasonAppearances, fitness: playersTable.fitness })
      .from(playersTable).where(eq(playersTable.id, p.id));
    if (current) {
      await db.update(playersTable).set({
        seasonAppearances: current.seasonAppearances + 1,
        fitness: Math.max(50, current.fitness - 10),
      }).where(eq(playersTable.id, p.id));
    }
  }

  // Advance game week
  const newWeek = state.currentWeek + 1;
  await db.update(gameStateTable).set({
    currentWeek: newWeek,
    currentDate: getWeekDate(2026, newWeek),
  }).where(eq(gameStateTable.id, state.id));

  // Post inbox message with result
  const isHome = fixture.homeClubId === state.clubId;
  const myScore = isHome ? result.homeScore : result.awayScore;
  const oppScore = isHome ? result.awayScore : result.homeScore;
  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));
  const opponent = clubMap[isHome ? fixture.awayClubId : fixture.homeClubId];
  const resultText = myScore > oppScore ? "Win" : myScore === oppScore ? "Draw" : "Defeat";
  const scorers = result.events.filter(e => e.type === "goal" && e.clubId === state.clubId).map(e => e.playerName).join(", ");

  await db.insert(inboxTable).values({
    clubId: state.clubId,
    date: getWeekDate(2026, newWeek),
    subject: `Match Report: ${myScore}-${oppScore} ${resultText} vs ${opponent}`,
    body: `Full-time score: ${myScore}-${oppScore}.\n\n${scorers ? `Scorers: ${scorers}` : "No goals scored."}\n\nPossession: ${isHome ? result.stats.homePossession : result.stats.awayPossession}%\nShots: ${isHome ? result.stats.homeShots : result.stats.awayShots} (${isHome ? result.stats.homeShotsOnTarget : result.stats.awayShotsOnTarget} on target)`,
    type: "match_result",
    isRead: false,
  });

  // Update matchday revenue
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId));
  if (club && isHome) {
    const matchdayIncome = Math.floor(club.stadiumCapacity * 0.85 * 45);
    await db.update(clubsTable).set({
      matchdayRevenue: club.matchdayRevenue + matchdayIncome,
    }).where(eq(clubsTable.id, state.clubId));
  }

  return res.json({
    id: fixture.id,
    week: fixture.week,
    date: fixture.date,
    homeClubId: fixture.homeClubId,
    homeClubName: clubMap[fixture.homeClubId] ?? "Unknown",
    awayClubId: fixture.awayClubId,
    awayClubName: clubMap[fixture.awayClubId] ?? "Unknown",
    status: "completed",
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    isPlayerClubHome: fixture.homeClubId === state.clubId,
    isPlayerClubAway: fixture.awayClubId === state.clubId,
    events: result.events,
    stats: result.stats,
  });
});

export default router;
