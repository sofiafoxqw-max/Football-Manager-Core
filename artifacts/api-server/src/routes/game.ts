import { Router } from "express";
import { db } from "@workspace/db";
import {
  gameStateTable, clubsTable, leaguesTable, playersTable,
  tacticsTable, inboxTable, fixturesTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  SetupGameBody, GetGameStateResponse,
  AdvanceGameResponse, ListClubsResponse,
} from "@workspace/api-zod";
import { initPlayerClub } from "../lib/seeder";
import { getWeekDate } from "../lib/gameEngine";
import { simulateNPCMatches, calcClubStrength, simulateMatchResult } from "../lib/gameEngine";

const router = Router();

router.get("/game/state", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state) {
    return res.status(404).json({ error: "No game state found" });
  }

  if (!state.started || !state.clubId) {
    return res.json({
      started: false,
      unreadMessages: 0,
    });
  }

  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId));
  const [league] = await db.select().from(leaguesTable).limit(1);

  // Calculate league position
  const allClubs = await db.select().from(clubsTable).where(eq(clubsTable.leagueId, league.id));
  const standings = await computeStandings(allClubs.map(c => c.id), league.id, state.currentWeek);
  const myStanding = standings.find(s => s.clubId === state.clubId);

  // Find next fixture
  const [nextFixture] = await db
    .select()
    .from(fixturesTable)
    .where(
      and(
        eq(fixturesTable.status, "scheduled"),
        eq(fixturesTable.leagueId, league.id),
      ),
    )
    .orderBy(asc(fixturesTable.week))
    .limit(1);

  const playerNextFixture = nextFixture && (nextFixture.homeClubId === state.clubId || nextFixture.awayClubId === state.clubId)
    ? nextFixture
    : await db.select().from(fixturesTable).where(
        and(
          eq(fixturesTable.status, "scheduled"),
          eq(fixturesTable.leagueId, league.id),
        ),
      ).orderBy(asc(fixturesTable.week)).limit(1).then(rows =>
        rows.find(r => r.homeClubId === state.clubId || r.awayClubId === state.clubId) ?? null
      );

  const unreadCount = await db.select().from(inboxTable).where(
    and(eq(inboxTable.clubId, state.clubId), eq(inboxTable.isRead, false))
  );

  // Injured count
  const allPlayers = await db.select({ isInjured: playersTable.isInjured, injuryWeeksLeft: playersTable.injuryWeeksLeft, morale: playersTable.morale })
    .from(playersTable).where(eq(playersTable.clubId, state.clubId));
  const injuredCount = allPlayers.filter(p => p.injuryWeeksLeft > 0).length;
  const moraleMap: Record<string, number> = { excellent: 5, happy: 4, good: 3, okay: 2, neutral: 2, unhappy: 1, sad: 0 };
  const avgMorale = allPlayers.length
    ? allPlayers.reduce((s, p) => s + (moraleMap[p.morale] ?? 3), 0) / allPlayers.length
    : 3;
  const teamMorale = avgMorale >= 4.5 ? "excellent" : avgMorale >= 3.5 ? "good" : avgMorale >= 2.5 ? "okay" : "poor";

  const clubs2 = await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId));
  const myClub = clubs2[0];

  const nextOpponentId = playerNextFixture
    ? (playerNextFixture.homeClubId === state.clubId ? playerNextFixture.awayClubId : playerNextFixture.homeClubId)
    : null;
  const allClubNames = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubNameMap = Object.fromEntries(allClubNames.map(c => [c.id, c.name]));

  return res.json({
    started: true,
    clubId: state.clubId,
    clubName: club?.name ?? null,
    managerName: state.managerName ?? null,
    leagueName: league?.name ?? null,
    currentDate: state.currentDate,
    currentWeek: state.currentWeek,
    totalWeeks: league?.totalWeeks ?? 38,
    season: state.season,
    leaguePosition: myStanding?.position ?? null,
    points: myStanding?.points ?? 0,
    nextFixtureId: playerNextFixture?.id ?? null,
    nextFixtureOpponent: nextOpponentId ? (clubNameMap[nextOpponentId] ?? null) : null,
    nextFixtureDate: playerNextFixture?.date ?? null,
    nextFixtureIsHome: playerNextFixture ? playerNextFixture.homeClubId === state.clubId : null,
    unreadMessages: unreadCount.length,
    transferBudget: myClub?.budget ?? null,
    injuredCount,
    morale: teamMorale,
  });
});

router.get("/game/clubs", async (_req, res) => {
  const clubs = await db.select().from(clubsTable).orderBy(asc(clubsTable.reputation));
  const league = await db.select().from(leaguesTable).limit(1).then(r => r[0]);
  return res.json(clubs.map(c => ({
    id: c.id,
    name: c.name,
    city: c.city,
    country: c.country,
    leagueName: league?.name ?? "Premier League",
    reputation: c.reputation,
    budget: c.budget,
    stadiumName: c.stadiumName,
    stadiumCapacity: c.stadiumCapacity,
    colors: c.colors,
    description: c.description ?? "",
  })));
});

router.post("/game/setup", async (req, res) => {
  const parse = SetupGameBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { clubId, managerName } = parse.data;

  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, clubId));
  if (!club) return res.status(404).json({ error: "Club not found" });

  const [league] = await db.select().from(leaguesTable).limit(1);
  const startDate = getWeekDate(2026, 1);

  // Reset or update game state
  const existing = await db.select().from(gameStateTable).limit(1);
  if (existing.length > 0) {
    await db.update(gameStateTable).set({
      started: true,
      clubId,
      managerName,
      currentDate: startDate,
      currentWeek: 0,
      season: 2026,
    }).where(eq(gameStateTable.id, existing[0].id));
  } else {
    await db.insert(gameStateTable).values({
      started: true,
      clubId,
      managerName,
      currentDate: startDate,
      currentWeek: 0,
      season: 2026,
    });
  }

  await initPlayerClub(clubId, 2026);

  return res.status(201).json({
    started: true,
    clubId,
    clubName: club.name,
    leagueName: league?.name ?? "Premier League",
    currentDate: startDate,
    currentWeek: 0,
    totalWeeks: 38,
    season: 2026,
    leaguePosition: null,
    points: 0,
    nextFixtureId: null,
    unreadMessages: 2,
  });
});

router.post("/game/advance", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.started || !state.clubId) {
    return res.status(400).json({ error: "No active game" });
  }

  const [league] = await db.select().from(leaguesTable).limit(1);
  const nextWeek = state.currentWeek + 1;

  if (nextWeek > (league?.totalWeeks ?? 38)) {
    return res.status(400).json({ error: "Season complete" });
  }

  // Simulate all NPC matches for this week
  await simulateNPCMatches(nextWeek, league.id, state.clubId);

  const newDate = getWeekDate(2026, nextWeek);
  await db.update(gameStateTable).set({
    currentWeek: nextWeek,
    currentDate: newDate,
  }).where(eq(gameStateTable.id, state.id));

  // Restore some fitness to all players
  const players = await db.select({ id: playersTable.id, fitness: playersTable.fitness })
    .from(playersTable)
    .where(eq(playersTable.clubId, state.clubId));

  for (const p of players) {
    await db.update(playersTable).set({
      fitness: Math.min(100, p.fitness + 5),
    }).where(eq(playersTable.id, p.id));
  }

  const allClubs = await db.select().from(clubsTable).where(eq(clubsTable.leagueId, league.id));
  const standings = await computeStandings(allClubs.map(c => c.id), league.id, nextWeek);
  const myStanding = standings.find(s => s.clubId === state.clubId);

  const [nextFixture] = await db
    .select()
    .from(fixturesTable)
    .where(
      and(
        eq(fixturesTable.status, "scheduled"),
        eq(fixturesTable.leagueId, league.id),
      ),
    )
    .orderBy(asc(fixturesTable.week))
    .limit(1);

  const myNextFixture = nextFixture ? nextFixture : null;

  const unreadCount = await db.select().from(inboxTable).where(
    and(eq(inboxTable.clubId, state.clubId), eq(inboxTable.isRead, false))
  );

  return res.json({
    started: true,
    clubId: state.clubId,
    clubName: (await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId)).limit(1))[0]?.name,
    leagueName: league?.name,
    currentDate: newDate,
    currentWeek: nextWeek,
    totalWeeks: 38,
    season: state.season,
    leaguePosition: myStanding?.position ?? null,
    points: myStanding?.points ?? 0,
    nextFixtureId: myNextFixture?.id ?? null,
    unreadMessages: unreadCount.length,
  });
});

async function computeStandings(clubIds: number[], leagueId: number, _currentWeek: number) {
  const completed = await db
    .select()
    .from(fixturesTable)
    .where(
      and(
        eq(fixturesTable.leagueId, leagueId),
        eq(fixturesTable.status, "completed"),
      ),
    );

  const table: Record<number, { clubId: number; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number; recentResults: string[] }> = {};

  for (const id of clubIds) {
    table[id] = { clubId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, recentResults: [] };
  }

  for (const f of completed) {
    const h = f.homeClubId;
    const a = f.awayClubId;
    const hg = f.homeScore ?? 0;
    const ag = f.awayScore ?? 0;

    if (!table[h]) continue;
    if (!table[a]) continue;

    table[h].played++;
    table[a].played++;
    table[h].gf += hg;
    table[h].ga += ag;
    table[a].gf += ag;
    table[a].ga += hg;

    if (hg > ag) {
      table[h].won++; table[h].points += 3;
      table[a].lost++;
      table[h].recentResults.unshift("W");
      table[a].recentResults.unshift("L");
    } else if (hg === ag) {
      table[h].drawn++; table[h].points++;
      table[a].drawn++; table[a].points++;
      table[h].recentResults.unshift("D");
      table[a].recentResults.unshift("D");
    } else {
      table[a].won++; table[a].points += 3;
      table[h].lost++;
      table[a].recentResults.unshift("W");
      table[h].recentResults.unshift("L");
    }
  }

  const sorted = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });

  return sorted.map((s, i) => ({ ...s, position: i + 1, goalDifference: s.gf - s.ga }));
}

export { computeStandings };
export default router;
