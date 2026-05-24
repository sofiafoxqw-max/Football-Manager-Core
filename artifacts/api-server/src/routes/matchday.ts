import { Router } from "express";
import { db } from "@workspace/db";
import { fixturesTable, clubsTable, gameStateTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomBetween } from "../lib/gameEngine";

const router = Router();

function buildCommentary(events: Array<{ minute: number; type: string; playerName: string; assistPlayerName?: string | null; clubId: number }>, homeClubName: string, awayClubName: string): Array<{ minute: number; text: string; type: string }> {
  const commentary: Array<{ minute: number; text: string; type: string }> = [];

  commentary.push({ minute: 0, text: "The referee blows the whistle — the match is underway!", type: "kickoff" });

  const generalLines = [
    "Play builds steadily from the back.",
    "Both teams are feeling each other out in the early stages.",
    "The crowd is loud and creating a great atmosphere.",
    "A foul in midfield halts a promising move.",
    "The ball is worked wide and a cross comes in, but it's headed clear.",
    "A free kick in a dangerous position...",
    "The tempo picks up as both sides push forward.",
    "A promising counter-attack is snuffed out by a well-timed tackle.",
    "The goalkeeper collects a routine cross comfortably.",
    "A corner is won — the players take up their positions.",
    "The ball breaks to the edge of the box... shot blocked!",
    "Excellent pressing wins the ball high up the pitch.",
    "A long ball over the top, but the offside flag is raised.",
    "Some neat interplay in the final third.",
    "The manager shouts instructions from the touchline.",
  ];

  const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);
  let lastMinute = 0;

  for (const event of sortedEvents) {
    const gap = event.minute - lastMinute;
    const numGeneral = Math.floor(gap / 10);
    for (let i = 0; i < Math.min(numGeneral, 2); i++) {
      const line = generalLines[randomBetween(0, generalLines.length - 1)];
      commentary.push({ minute: lastMinute + Math.floor(gap / 2), text: line, type: "general" });
    }

    if (event.type === "goal") {
      const texts = [
        `GOOOAL! ${event.playerName} finds the net!${event.assistPlayerName ? ` Brilliant assist from ${event.assistPlayerName}.` : ""}`,
        `${event.playerName} scores! ${event.assistPlayerName ? `Set up by ${event.assistPlayerName}.` : "What a finish!"}`,
        `It's in the back of the net! ${event.playerName} makes no mistake!${event.assistPlayerName ? ` ${event.assistPlayerName} with the assist.` : ""}`,
      ];
      commentary.push({ minute: event.minute, text: texts[randomBetween(0, texts.length - 1)], type: "goal" });
    } else if (event.type === "yellow_card") {
      commentary.push({ minute: event.minute, text: `${event.playerName} is shown a yellow card by the referee.`, type: "card" });
    } else if (event.type === "red_card") {
      commentary.push({ minute: event.minute, text: `${event.playerName} receives a straight red card! Down to ten men!`, type: "card" });
    } else if (event.type === "substitution") {
      commentary.push({ minute: event.minute, text: `Substitution being made on the pitch.`, type: "substitution" });
    }

    lastMinute = event.minute;
  }

  if (lastMinute < 45) {
    commentary.push({ minute: 45, text: "The referee blows for half time. Both teams head to the dressing room.", type: "halftime" });
  }

  commentary.push({ minute: 90, text: "Full time! The final whistle goes.", type: "fulltime" });

  return commentary.sort((a, b) => a.minute - b.minute);
}

function buildPlayerRatings(
  events: Array<{ type: string; playerId?: number | null; playerName: string; assistPlayerId?: number | null; assistPlayerName?: string | null; clubId: number }>,
  players: Array<{ id: number; name: string; position: string; overall: number }>,
  clubId: number,
): Array<{ playerId: number; playerName: string; position: string; rating: number; goals: number; assists: number; yellowCards: number }> {
  const ratings = new Map<number, { goals: number; assists: number; yellowCards: number }>();

  for (const event of events) {
    if (event.clubId === clubId && event.playerId) {
      if (!ratings.has(event.playerId)) ratings.set(event.playerId, { goals: 0, assists: 0, yellowCards: 0 });
      const r = ratings.get(event.playerId)!;
      if (event.type === "goal") r.goals++;
      if (event.type === "yellow_card") r.yellowCards++;
    }
    if (event.assistPlayerId) {
      if (!ratings.has(event.assistPlayerId)) ratings.set(event.assistPlayerId, { goals: 0, assists: 0, yellowCards: 0 });
      ratings.get(event.assistPlayerId)!.assists++;
    }
  }

  return players.slice(0, 11).map(p => {
    const stats = ratings.get(p.id) ?? { goals: 0, assists: 0, yellowCards: 0 };
    const baseRating = 6.0 + (p.overall - 70) * 0.02;
    const bonus = stats.goals * 0.8 + stats.assists * 0.4 - stats.yellowCards * 0.3;
    const rating = Math.min(10, Math.max(4, baseRating + bonus + (Math.random() * 1.4 - 0.7)));
    return {
      playerId: p.id,
      playerName: p.name,
      position: p.position,
      rating: Math.round(rating * 10) / 10,
      goals: stats.goals,
      assists: stats.assists,
      yellowCards: stats.yellowCards,
    };
  });
}

router.get("/fixtures/:id/live", async (req, res) => {
  const id = Number(req.params.id);
  const [fixture] = await db.select().from(fixturesTable).where(eq(fixturesTable.id, id));
  if (!fixture) return res.status(404).json({ error: "Fixture not found" });

  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));

  const events = (fixture.events ?? []) as Array<{ minute: number; type: string; clubId: number; playerId?: number | null; playerName: string; assistPlayerId?: number | null; assistPlayerName?: string | null }>;

  const commentary = buildCommentary(
    events,
    clubMap[fixture.homeClubId] ?? "Home",
    clubMap[fixture.awayClubId] ?? "Away",
  );

  return res.json({
    fixtureId: fixture.id,
    status: fixture.status,
    currentMinute: fixture.status === "completed" ? 90 : 0,
    homeScore: fixture.homeScore ?? 0,
    awayScore: fixture.awayScore ?? 0,
    homeClubName: clubMap[fixture.homeClubId] ?? "Home",
    awayClubName: clubMap[fixture.awayClubId] ?? "Away",
    commentary,
    events,
  });
});

// Team talk
router.post("/team-talk", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { tone, timing } = req.body as { tone: string; timing: string };

  const effects: Record<string, { morale: "positive" | "neutral" | "negative"; change: number; message: string }> = {
    encourage: { morale: "positive", change: 3, message: "The players responded well to your encouraging words. Morale is up!" },
    praise: { morale: "positive", change: 2, message: "The squad appreciated the praise. They feel confident going into the match." },
    motivate: { morale: "positive", change: 4, message: "Rousing team talk! The players are fired up and ready to fight." },
    calm: { morale: "neutral", change: 1, message: "The players remain composed. A measured approach from the dugout." },
    demand: { morale: "neutral", change: 0, message: "The players heard the demands. Some reacted positively, others look nervous." },
    warning: { morale: "negative", change: -2, message: "The harsh words created tension in the dressing room. Some players look unsettled." },
  };

  const effect = effects[tone] ?? effects.calm;

  // Update morale for starters
  const players = await db.select({ id: playersTable.id, morale: playersTable.morale })
    .from(playersTable).where(eq(playersTable.clubId, state.clubId));

  const moraleMap: Record<string, string> = { sad: "unhappy", unhappy: "neutral", neutral: "good", good: "happy", happy: "happy" };
  const moraleDownMap: Record<string, string> = { happy: "good", good: "neutral", neutral: "unhappy", unhappy: "sad", sad: "sad" };

  for (const p of players.slice(0, 11)) {
    const newMorale = effect.change > 0 ? (moraleMap[p.morale] ?? "good") : effect.change < 0 ? (moraleDownMap[p.morale] ?? "neutral") : p.morale;
    await db.update(playersTable).set({ morale: newMorale }).where(eq(playersTable.id, p.id));
  }

  return res.json({ moraleEffect: effect.morale, message: effect.message, affectedPlayers: Math.min(11, players.length) });
});

// Updated fixtures/:id endpoint with commentary + playerRatings
router.get("/fixtures/:id/detail", async (req, res) => {
  const id = Number(req.params.id);
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const [fixture] = await db.select().from(fixturesTable).where(eq(fixturesTable.id, id));
  if (!fixture) return res.status(404).json({ error: "Fixture not found" });

  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));

  const events = (fixture.events ?? []) as Array<{ minute: number; type: string; clubId: number; playerId?: number | null; playerName: string; assistPlayerId?: number | null; assistPlayerName?: string | null }>;
  const commentary = buildCommentary(events, clubMap[fixture.homeClubId] ?? "Home", clubMap[fixture.awayClubId] ?? "Away");

  const isPlayerHome = fixture.homeClubId === state.clubId;
  const playerClubId = state.clubId;

  const playerClubPlayers = await db.select({ id: playersTable.id, name: playersTable.name, position: playersTable.position, overall: playersTable.overall })
    .from(playersTable).where(eq(playersTable.clubId, playerClubId));

  const playerRatings = fixture.status === "completed"
    ? buildPlayerRatings(events, playerClubPlayers, playerClubId)
    : [];

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
    competition: "Premier League",
    events,
    stats: {
      homePossession: fixture.homePossession ?? 50,
      awayPossession: fixture.awayPossession ?? 50,
      homeShots: fixture.homeShots ?? 0,
      awayShots: fixture.awayShots ?? 0,
      homeShotsOnTarget: fixture.homeShotsOnTarget ?? 0,
      awayShotsOnTarget: fixture.awayShotsOnTarget ?? 0,
      homeCorners: fixture.homeCorners ?? 0,
      awayCorners: fixture.awayCorners ?? 0,
      homeFouls: 0,
      awayFouls: 0,
      homeYellowCards: events.filter(e => e.type === "yellow_card" && e.clubId === fixture.homeClubId).length,
      awayYellowCards: events.filter(e => e.type === "yellow_card" && e.clubId === fixture.awayClubId).length,
    },
    commentary,
    playerRatings,
  });
});

export default router;
