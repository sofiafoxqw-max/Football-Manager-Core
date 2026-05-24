import { Router } from "express";
import { db } from "@workspace/db";
import { clubsTable, playersTable, gameStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/finances", async (_req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId));
  if (!club) return res.status(404).json({ error: "Club not found" });

  const players = await db.select({ weeklySalary: playersTable.weeklySalary })
    .from(playersTable)
    .where(eq(playersTable.clubId, state.clubId));

  const currentWeeklyWages = players.reduce((sum, p) => sum + p.weeklySalary, 0);

  const seasonExpenditure = club.transferSpend + currentWeeklyWages * (state.currentWeek || 1);
  const seasonRevenue = club.transferIncome + club.matchdayRevenue + club.sponsorshipRevenue;

  return res.json({
    balance: club.budget,
    transferBudget: Math.floor(club.budget * 0.7),
    wageBudget: club.wageBudget,
    currentWeeklyWages,
    seasonRevenue,
    seasonExpenditure,
    matchdayRevenue: club.matchdayRevenue,
    sponsorshipRevenue: club.sponsorshipRevenue,
    transferIncome: club.transferIncome,
    transferSpend: club.transferSpend,
  });
});

export default router;
