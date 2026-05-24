import { Router } from "express";
import { db } from "@workspace/db";
import { staffTable, gameStateTable, clubsTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";

const router = Router();

router.get("/staff", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const staff = await db.select().from(staffTable).where(eq(staffTable.clubId, state.clubId));
  return res.json(staff.map(s => ({ ...s, isHired: true })));
});

router.get("/staff/market", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const available = await db.select().from(staffTable).where(isNull(staffTable.clubId));
  return res.json(available.map(s => ({ ...s, isHired: false })));
});

router.post("/staff/hire", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { staffId } = req.body as { staffId: number };
  const [member] = await db.select().from(staffTable).where(eq(staffTable.id, staffId));
  if (!member) return res.status(404).json({ error: "Staff member not found" });
  if (member.clubId !== null) return res.status(400).json({ error: "Staff member already hired" });

  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId));
  if (!club) return res.status(400).json({ error: "Club not found" });
  if (club.budget < member.weeklySalary * 52) return res.status(400).json({ error: "Insufficient budget" });

  await db.update(staffTable).set({ clubId: state.clubId, isHired: true }).where(eq(staffTable.id, staffId));
  await db.update(clubsTable).set({ budget: club.budget - member.weeklySalary * 52 }).where(eq(clubsTable.id, state.clubId));

  const [updated] = await db.select().from(staffTable).where(eq(staffTable.id, staffId));
  return res.json({ ...updated, isHired: true });
});

export default router;
