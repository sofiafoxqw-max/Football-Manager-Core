import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, gameStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetPlayerParams } from "@workspace/api-zod";

const router = Router();

function formatPlayer(p: typeof playersTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    nationality: p.nationality,
    position: p.position,
    overall: p.overall,
    potential: p.potential,
    attributes: {
      pace: p.pace,
      shooting: p.shooting,
      passing: p.passing,
      dribbling: p.dribbling,
      defending: p.defending,
      physicality: p.physicality,
      goalkeeping: p.goalkeeping,
    },
    form: p.form,
    fitness: p.fitness,
    morale: p.morale,
    value: p.value,
    weeklySalary: p.weeklySalary,
    contractEndsYear: p.contractEndsYear,
    seasonGoals: p.seasonGoals,
    seasonAssists: p.seasonAssists,
    clubId: p.clubId,
    isOnTransferList: p.isOnTransferList,
  };
}

router.get("/squad", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.clubId, state.clubId));

  return res.json(players.map(formatPlayer));
});

router.get("/players/:id", async (req, res) => {
  const parse = GetPlayerParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid player id" });

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, parse.data.id));

  if (!player) return res.status(404).json({ error: "Player not found" });

  return res.json(formatPlayer(player));
});

export default router;
