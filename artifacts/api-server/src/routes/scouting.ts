import { Router } from "express";
import { db } from "@workspace/db";
import { shortlistTable, playersTable, clubsTable, gameStateTable } from "@workspace/db";
import { eq, and, ne, lte } from "drizzle-orm";
import { getWeekDate } from "../lib/gameEngine";

const router = Router();

const SCOUT_COMMENTS = [
  "Excellent technical ability, would strengthen any squad",
  "Strong physical presence, dominant in aerial duels",
  "Exceptional passing range, controls the tempo well",
  "Rapid acceleration, a constant threat in behind",
  "Intelligent movement, always finds space in the box",
  "Reliable under pressure, good reading of the game",
  "High potential, could develop into a top player",
  "Experienced campaigner, brings leadership to the side",
  "Versatile player, comfortable in multiple positions",
  "Creative spark, capable of moments of brilliance",
];

router.get("/shortlist", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const entries = await db.select().from(shortlistTable).where(eq(shortlistTable.clubId, state.clubId));
  const result = [];

  for (const entry of entries) {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, entry.playerId));
    if (!player) continue;
    const [club] = await db.select({ name: clubsTable.name }).from(clubsTable).where(eq(clubsTable.id, player.clubId));

    result.push({
      playerId: player.id,
      playerName: player.name,
      age: player.age,
      nationality: player.nationality,
      position: player.position,
      overall: player.overall,
      potential: player.potential,
      clubId: player.clubId,
      clubName: club?.name ?? "Unknown",
      value: player.value,
      weeklySalary: player.weeklySalary,
      isOnTransferList: player.isOnTransferList,
      notes: entry.notes ?? null,
      dateAdded: entry.dateAdded,
    });
  }

  return res.json(result);
});

router.post("/shortlist", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { playerId, notes } = req.body as { playerId: number; notes?: string | null };
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, playerId));
  if (!player) return res.status(404).json({ error: "Player not found" });

  const existing = await db.select().from(shortlistTable)
    .where(and(eq(shortlistTable.clubId, state.clubId), eq(shortlistTable.playerId, playerId)));
  if (existing.length) return res.status(409).json({ error: "Already on shortlist" });

  const dateAdded = getWeekDate(state.season, state.currentWeek ?? 1);
  await db.insert(shortlistTable).values({ clubId: state.clubId, playerId, notes: notes ?? null, dateAdded });

  const [club] = await db.select({ name: clubsTable.name }).from(clubsTable).where(eq(clubsTable.id, player.clubId));

  return res.status(201).json({
    playerId: player.id,
    playerName: player.name,
    age: player.age,
    nationality: player.nationality,
    position: player.position,
    overall: player.overall,
    potential: player.potential,
    clubId: player.clubId,
    clubName: club?.name ?? "Unknown",
    value: player.value,
    weeklySalary: player.weeklySalary,
    isOnTransferList: player.isOnTransferList,
    notes: notes ?? null,
    dateAdded,
  });
});

router.delete("/shortlist/:playerId", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const playerId = Number(req.params.playerId);
  await db.delete(shortlistTable)
    .where(and(eq(shortlistTable.clubId, state.clubId), eq(shortlistTable.playerId, playerId)));

  return res.json({ success: true, message: "Removed from shortlist" });
});

router.post("/scouts/search", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { position, minOverall = 60, maxAge = 35, maxValue = 999999999, nationality } =
    req.body as { position?: string; minOverall?: number; maxAge?: number; maxValue?: number; nationality?: string };

  let query = db.select().from(playersTable)
    .where(and(ne(playersTable.clubId, state.clubId)));

  const allPlayers = await query;

  const filtered = allPlayers.filter(p =>
    p.overall >= minOverall &&
    p.age <= maxAge &&
    p.value <= maxValue &&
    (!position || p.position === position) &&
    (!nationality || p.nationality === nationality),
  ).slice(0, 30);

  const clubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(clubs.map(c => [c.id, c.name]));

  return res.json(filtered.map(p => {
    const scoutRating = Math.min(5, Math.max(1, Math.round((p.overall - 55) / 8) + 1));
    const comment = SCOUT_COMMENTS[Math.floor(Math.random() * SCOUT_COMMENTS.length)];
    return {
      playerId: p.id,
      playerName: p.name,
      age: p.age,
      nationality: p.nationality,
      position: p.position,
      overall: p.overall,
      potential: p.potential,
      clubName: clubMap[p.clubId] ?? "Unknown",
      value: p.value,
      weeklySalary: p.weeklySalary,
      isOnTransferList: p.isOnTransferList,
      scoutRating,
      scoutComment: comment,
      attributes: {
        pace: p.pace,
        shooting: p.shooting,
        passing: p.passing,
        dribbling: p.dribbling,
        defending: p.defending,
        physicality: p.physicality,
        goalkeeping: p.goalkeeping,
      },
    };
  }));
});

export default router;
