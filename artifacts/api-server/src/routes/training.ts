import { Router } from "express";
import { db } from "@workspace/db";
import { trainingTable, staffTable, gameStateTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_SCHEDULE = [
  { day: "monday", type: "tactics", intensity: "normal" },
  { day: "tuesday", type: "attacking", intensity: "hard" },
  { day: "wednesday", type: "fitness", intensity: "normal" },
  { day: "thursday", type: "defending", intensity: "normal" },
  { day: "friday", type: "match_prep", intensity: "light" },
  { day: "saturday", type: "rest", intensity: "light" },
  { day: "sunday", type: "rest", intensity: "light" },
];

async function getCoachingBonus(clubId: number): Promise<number> {
  const coaches = await db.select({ rating: staffTable.rating })
    .from(staffTable)
    .where(eq(staffTable.clubId, clubId));
  if (!coaches.length) return 1.0;
  const avg = coaches.reduce((s, c) => s + c.rating, 0) / coaches.length;
  return 1.0 + (avg - 5) * 0.02;
}

router.get("/training", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  let [training] = await db.select().from(trainingTable).where(eq(trainingTable.clubId, state.clubId));
  if (!training) {
    await db.insert(trainingTable).values({ clubId: state.clubId, schedule: DEFAULT_SCHEDULE, teamFocus: "balanced" });
    [training] = await db.select().from(trainingTable).where(eq(trainingTable.clubId, state.clubId));
  }

  const coachingBonus = await getCoachingBonus(state.clubId);
  return res.json({ sessions: training.schedule, teamFocus: training.teamFocus, coachingBonus });
});

router.put("/training", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { sessions, teamFocus } = req.body as { sessions: unknown[]; teamFocus: string };

  const [existing] = await db.select().from(trainingTable).where(eq(trainingTable.clubId, state.clubId));
  if (existing) {
    await db.update(trainingTable).set({ schedule: sessions, teamFocus }).where(eq(trainingTable.clubId, state.clubId));
  } else {
    await db.insert(trainingTable).values({ clubId: state.clubId, schedule: sessions, teamFocus });
  }

  const coachingBonus = await getCoachingBonus(state.clubId);
  return res.json({ sessions, teamFocus, coachingBonus });
});

router.get("/training/individual", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const players = await db.select({
    id: playersTable.id,
    name: playersTable.name,
    position: playersTable.position,
    overall: playersTable.overall,
    trainingFocus: playersTable.trainingFocus,
    trainingProgress: playersTable.trainingProgress,
  }).from(playersTable).where(eq(playersTable.clubId, state.clubId));

  return res.json(players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    position: p.position,
    overall: p.overall,
    focus: p.trainingFocus ?? null,
    progress: p.trainingProgress,
  })));
});

router.put("/training/individual", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { assignments } = req.body as { assignments: Array<{ playerId: number; focus?: string | null }> };
  for (const a of assignments) {
    await db.update(playersTable)
      .set({ trainingFocus: a.focus ?? null })
      .where(eq(playersTable.id, a.playerId));
  }

  const players = await db.select({
    id: playersTable.id,
    name: playersTable.name,
    position: playersTable.position,
    overall: playersTable.overall,
    trainingFocus: playersTable.trainingFocus,
    trainingProgress: playersTable.trainingProgress,
  }).from(playersTable).where(eq(playersTable.clubId, state.clubId));

  return res.json(players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    position: p.position,
    overall: p.overall,
    focus: p.trainingFocus ?? null,
    progress: p.trainingProgress,
  })));
});

export default router;
