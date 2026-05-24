import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, gameStateTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { getWeekDate } from "../lib/gameEngine";

const router = Router();

router.get("/injuries", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const injured = await db.select().from(playersTable)
    .where(and(eq(playersTable.clubId, state.clubId), gt(playersTable.injuryWeeksLeft, 0)));

  return res.json(injured.map(p => {
    const weeks = p.injuryWeeksLeft;
    const severity = weeks <= 1 ? "minor" : weeks <= 3 ? "moderate" : weeks <= 6 ? "serious" : "severe";
    const returnDate = getWeekDate(state.season, (state.currentWeek ?? 1) + weeks);
    return {
      playerId: p.id,
      playerName: p.name,
      position: p.position,
      injuryType: p.injuryType ?? "Muscle strain",
      weeksRemaining: weeks,
      returnDate,
      severity,
    };
  }));
});

export default router;
