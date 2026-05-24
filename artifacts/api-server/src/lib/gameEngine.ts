import { db } from "@workspace/db";
import {
  playersTable, fixturesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function calcClubStrength(players: Array<{ overall: number; position: string; fitness: number; form: number }>): number {
  if (!players.length) return 50;
  const starters = players.slice(0, Math.min(11, players.length));
  const avg = starters.reduce((sum, p) => {
    const fitnessModifier = p.fitness / 100;
    const formModifier = (p.form - 5) * 0.5;
    return sum + p.overall * fitnessModifier + formModifier;
  }, 0) / starters.length;
  return clamp(avg, 30, 99);
}

interface MatchEvent {
  minute: number;
  type: string;
  clubId: number;
  playerId: number | null;
  playerName: string;
  assistPlayerId: number | null;
  assistPlayerName: string | null;
}

export function simulateMatchResult(
  homeStrength: number,
  awayStrength: number,
  homeClubId: number,
  awayClubId: number,
  homePlayers: Array<{ id: number; name: string; position: string; overall: number }>,
  awayPlayers: Array<{ id: number; name: string; position: string; overall: number }>,
) {
  // Home advantage
  const homeAdj = homeStrength + 3;
  const awayAdj = awayStrength;
  const diff = (homeAdj - awayAdj) / 20;

  // Expected goals (Poisson-ish)
  const homeExpectedGoals = clamp(1.5 + diff * 0.6, 0.3, 4.0);
  const awayExpectedGoals = clamp(1.5 - diff * 0.6, 0.3, 4.0);

  const homeGoals = poissonRandom(homeExpectedGoals);
  const awayGoals = poissonRandom(awayExpectedGoals);

  const events: MatchEvent[] = [];
  const usedMinutes = new Set<number>();

  function getMinute(): number {
    let m = randomBetween(1, 90);
    while (usedMinutes.has(m)) m = (m % 90) + 1;
    usedMinutes.add(m);
    return m;
  }

  function getScorer(players: typeof homePlayers): { id: number; name: string } {
    const attackers = players.filter(p => ["ST", "CF", "LW", "RW", "CAM"].includes(p.position));
    const pool = attackers.length > 0 ? attackers : players;
    const weights = pool.map(p => p.overall);
    const idx = weightedRandom(weights);
    return { id: pool[idx].id, name: pool[idx].name };
  }

  function getAssist(players: typeof homePlayers, scorerId: number): { id: number; name: string } | null {
    if (Math.random() < 0.6) {
      const mids = players.filter(p => !["GK"].includes(p.position) && p.id !== scorerId);
      if (mids.length > 0) {
        const idx = Math.floor(Math.random() * mids.length);
        return { id: mids[idx].id, name: mids[idx].name };
      }
    }
    return null;
  }

  // Home goals
  for (let i = 0; i < homeGoals; i++) {
    const scorer = getScorer(homePlayers);
    const assist = getAssist(homePlayers, scorer.id);
    events.push({
      minute: getMinute(),
      type: "goal",
      clubId: homeClubId,
      playerId: scorer.id,
      playerName: scorer.name,
      assistPlayerId: assist?.id ?? null,
      assistPlayerName: assist?.name ?? null,
    });
  }

  // Away goals
  for (let i = 0; i < awayGoals; i++) {
    const scorer = getScorer(awayPlayers);
    const assist = getAssist(awayPlayers, scorer.id);
    events.push({
      minute: getMinute(),
      type: "goal",
      clubId: awayClubId,
      playerId: scorer.id,
      playerName: scorer.name,
      assistPlayerId: assist?.id ?? null,
      assistPlayerName: assist?.name ?? null,
    });
  }

  // Cards (2-5 yellow cards total)
  const numYellows = randomBetween(1, 4);
  const allPlayers = [
    ...homePlayers.map(p => ({ ...p, clubId: homeClubId })),
    ...awayPlayers.map(p => ({ ...p, clubId: awayClubId })),
  ];
  for (let i = 0; i < numYellows; i++) {
    const player = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    events.push({
      minute: getMinute(),
      type: "yellow_card",
      clubId: player.clubId,
      playerId: player.id,
      playerName: player.name,
      assistPlayerId: null,
      assistPlayerName: null,
    });
  }

  // Sort by minute
  events.sort((a, b) => a.minute - b.minute);

  // Stats
  const strengthRatio = homeAdj / (homeAdj + awayAdj);
  const homePossession = clamp(Math.round(40 + strengthRatio * 20 + randomBetween(-5, 5)), 35, 65);
  const homeShots = clamp(homeGoals * 3 + randomBetween(2, 8), 3, 25);
  const awayShots = clamp(awayGoals * 3 + randomBetween(2, 8), 3, 25);
  const homeShotsOnTarget = clamp(homeGoals + randomBetween(0, 4), homeGoals, homeShots);
  const awayShotsOnTarget = clamp(awayGoals + randomBetween(0, 4), awayGoals, awayShots);
  const homeCorners = randomBetween(2, 12);
  const awayCorners = randomBetween(2, 12);

  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    events,
    stats: {
      homePossession,
      awayPossession: 100 - homePossession,
      homeShots,
      awayShots,
      homeShotsOnTarget,
      awayShotsOnTarget,
      homeCorners,
      awayCorners,
    },
  };
}

function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function getWeekDate(baseYear: number, week: number): string {
  const startDate = new Date(`${baseYear}-08-10`);
  startDate.setDate(startDate.getDate() + (week - 1) * 7);
  return startDate.toISOString().split("T")[0];
}

export async function generateFixtures(leagueId: number, clubIds: number[], season: number) {
  const fixtures: Array<{ leagueId: number; week: number; date: string; homeClubId: number; awayClubId: number; status: string }> = [];

  // Round-robin schedule
  const n = clubIds.length;
  const rounds = (n - 1) * 2;
  const halfRounds = n - 1;

  const ids = [...clubIds];
  if (n % 2 !== 0) ids.push(-1); // bye

  for (let round = 0; round < halfRounds; round++) {
    for (let match = 0; match < ids.length / 2; match++) {
      const home = ids[match];
      const away = ids[ids.length - 1 - match];
      if (home !== -1 && away !== -1) {
        fixtures.push({
          leagueId,
          week: round + 1,
          date: getWeekDate(season, round + 1),
          homeClubId: home,
          awayClubId: away,
          status: "scheduled",
        });
      }
    }
    // Rotate
    const last = ids.pop()!;
    ids.splice(1, 0, last);
  }

  // Return leg
  for (let round = 0; round < halfRounds; round++) {
    for (let match = 0; match < ids.length / 2; match++) {
      const home = ids[match];
      const away = ids[ids.length - 1 - match];
      if (home !== -1 && away !== -1) {
        fixtures.push({
          leagueId,
          week: halfRounds + round + 1,
          date: getWeekDate(season, halfRounds + round + 1),
          homeClubId: away,
          awayClubId: home,
          status: "scheduled",
        });
      }
    }
    const last = ids.pop()!;
    ids.splice(1, 0, last);
  }

  // Only use first 38 weeks max
  const trimmed = fixtures.filter(f => f.week <= Math.min(38, rounds));
  await db.insert(fixturesTable).values(trimmed);
}

export async function simulateNPCMatches(week: number, leagueId: number, playerClubId: number) {
  const npcs = await db
    .select()
    .from(fixturesTable)
    .where(
      and(
        eq(fixturesTable.leagueId, leagueId),
        eq(fixturesTable.week, week),
        eq(fixturesTable.status, "scheduled"),
      ),
    );

  for (const fixture of npcs) {
    if (fixture.homeClubId === playerClubId || fixture.awayClubId === playerClubId) continue;

    const homePlayers = await db
      .select({ id: playersTable.id, name: playersTable.name, overall: playersTable.overall, position: playersTable.position, fitness: playersTable.fitness, form: playersTable.form })
      .from(playersTable)
      .where(eq(playersTable.clubId, fixture.homeClubId));

    const awayPlayers = await db
      .select({ id: playersTable.id, name: playersTable.name, overall: playersTable.overall, position: playersTable.position, fitness: playersTable.fitness, form: playersTable.form })
      .from(playersTable)
      .where(eq(playersTable.clubId, fixture.awayClubId));

    const homeStrength = calcClubStrength(homePlayers);
    const awayStrength = calcClubStrength(awayPlayers);

    const result = simulateMatchResult(
      homeStrength,
      awayStrength,
      fixture.homeClubId,
      fixture.awayClubId,
      homePlayers,
      awayPlayers,
    );

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

    // Update player season stats
    for (const event of result.events) {
      if (event.type === "goal" && event.playerId) {
        const [p] = await db.select({ seasonGoals: playersTable.seasonGoals })
          .from(playersTable).where(eq(playersTable.id, event.playerId));
        if (p) await db.update(playersTable)
          .set({ seasonGoals: p.seasonGoals + 1 })
          .where(eq(playersTable.id, event.playerId));
      }
    }

    // Update appearances for all starters
    for (const player of [...homePlayers.slice(0, 11), ...awayPlayers.slice(0, 11)]) {
      const [p] = await db.select({ seasonAppearances: playersTable.seasonAppearances })
        .from(playersTable).where(eq(playersTable.id, player.id));
      if (p) await db.update(playersTable)
        .set({ seasonAppearances: p.seasonAppearances + 1 })
        .where(eq(playersTable.id, player.id));
    }
  }
}
