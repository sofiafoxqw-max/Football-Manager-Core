import { Router } from "express";
import { db } from "@workspace/db";
import {
  gfcUsersTable,
  gfcClubsTable,
  gfcTransactionsTable,
  gfcTransferRecordsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../../lib/requireAuth";
import { getGfcUser, getGfcClubByUser } from "./helpers";

const router = Router();

router.get("/summary", async (_req, res) => {
  try {
    const users = await db.select().from(gfcUsersTable);
    const clubs = await db.select().from(gfcClubsTable);
    const transfers = await db.select().from(gfcTransferRecordsTable);
    const totalMoney = users.reduce((sum, u) => sum + u.balance, 0);
    const totalTransferVolume = transfers.reduce((sum, t) => sum + t.fee, 0);
    const taxPool = transfers.reduce((sum, t) => sum + t.taxPaid, 0);
    res.json({
      totalMoneyInCirculation: totalMoney,
      taxPoolBalance: taxPool,
      totalTransfersThisSeason: transfers.length,
      totalTransferVolume,
      activeOwners: users.filter((u) => u.role === "owner").length,
      activeCoaches: users.filter((u) => u.role === "coach").length,
      totalClubs: clubs.length,
      taxRate: 0.1,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-finances", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.gfcUserId);
    if (!user) return res.status(404).json({ error: "Not registered" });
    const club = await getGfcClubByUser(user);
    const txs = await db.select().from(gfcTransactionsTable).where(eq(gfcTransactionsTable.userId, user.id));
    const weeklyIncome = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) / 52 | 0;
    const weeklyExpenses = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) / 52 | 0;
    res.json({
      balance: user.balance,
      weeklyIncome,
      weeklyExpenses,
      totalEarned: user.totalEarned,
      totalSpent: user.totalSpent,
      clubValue: club?.currentValue ?? null,
      prizeMoneyEarned: user.prizeMoneyEarned,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions", requireAuth, async (req: any, res) => {
  try {
    const user = await getGfcUser(req.gfcUserId);
    if (!user) return res.status(404).json({ error: "Not registered" });
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const txs = await db.select().from(gfcTransactionsTable)
      .where(eq(gfcTransactionsTable.userId, user.id))
      .orderBy(desc(gfcTransactionsTable.createdAt))
      .limit(limit);
    res.json(txs.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
