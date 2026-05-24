import { Router } from "express";
import { db } from "@workspace/db";
import { tacticsTable, gameStateTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateTacticsBody } from "@workspace/api-zod";

const router = Router();

router.get("/tactics", async (_req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const [tactic] = await db
    .select()
    .from(tacticsTable)
    .where(eq(tacticsTable.clubId, state.clubId));

  if (!tactic) {
    return res.json({
      formation: "4-3-3",
      mentality: "balanced",
      pressing: 5,
      tempo: 5,
      width: 5,
      captainId: null,
      startingXI: [],
    });
  }

  // Enrich startingXI with player names
  const xi = (tactic.startingXI as Array<{ slot: number; position: string; playerId: number | null; playerName: string | null }>);
  const playerIds = xi.filter(s => s.playerId).map(s => s.playerId as number);
  const players = playerIds.length > 0
    ? await db.select({ id: playersTable.id, name: playersTable.name }).from(playersTable).where(eq(playersTable.clubId, state.clubId))
    : [];

  const enrichedXI = xi.map(slot => ({
    slot: slot.slot,
    position: slot.position,
    playerId: slot.playerId ?? null,
    playerName: slot.playerId ? (players.find(p => p.id === slot.playerId)?.name ?? null) : null,
  }));

  return res.json({
    formation: tactic.formation,
    mentality: tactic.mentality,
    pressing: tactic.pressing,
    tempo: tactic.tempo,
    width: tactic.width,
    captainId: tactic.captainId ?? null,
    startingXI: enrichedXI,
  });
});

router.put("/tactics", async (req, res) => {
  const parse = UpdateTacticsBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { formation, mentality, pressing, tempo, width, captainId, startingXI } = parse.data;

  const [existing] = await db.select().from(tacticsTable).where(eq(tacticsTable.clubId, state.clubId));

  const xiWithNames = startingXI as Array<{ slot: number; position: string; playerId: number | null }>;

  if (existing) {
    await db.update(tacticsTable).set({
      formation,
      mentality,
      pressing,
      tempo,
      width,
      captainId: captainId ?? null,
      startingXI: xiWithNames,
    }).where(eq(tacticsTable.clubId, state.clubId));
  } else {
    await db.insert(tacticsTable).values({
      clubId: state.clubId,
      formation,
      mentality,
      pressing,
      tempo,
      width,
      captainId: captainId ?? null,
      startingXI: xiWithNames,
    });
  }

  return res.json({
    formation,
    mentality,
    pressing,
    tempo,
    width,
    captainId: captainId ?? null,
    startingXI: xiWithNames.map(s => ({
      slot: s.slot,
      position: s.position,
      playerId: s.playerId ?? null,
      playerName: null,
    })),
  });
});

export default router;
