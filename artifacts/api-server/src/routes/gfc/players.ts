import { Router } from "express";
import { db } from "@workspace/db";
import { gfcPlayersTable, gfcClubsTable } from "@workspace/db";
import { eq, and, lte, gte, isNull } from "drizzle-orm";

const router = Router();

function mapPlayer(p: any, clubName: string | null) {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    nationality: p.nationality,
    position: p.position,
    overall: p.overall,
    potential: p.potential,
    pace: p.pace,
    shooting: p.shooting,
    passing: p.passing,
    dribbling: p.dribbling,
    defending: p.defending,
    physicality: p.physicality,
    value: p.value,
    weeklySalary: p.weeklySalary,
    contractEndsWeek: p.contractEndsWeek,
    clubId: p.clubId,
    clubName,
    isOnTransferList: p.isOnTransferList,
    isFreeAgent: p.isFreeAgent,
  };
}

router.get("/", async (req, res) => {
  try {
    const { clubId, freeAgent, position, maxAge, minOverall } = req.query;
    let players = await db.select().from(gfcPlayersTable);
    if (clubId) players = players.filter((p) => p.clubId === parseInt(clubId as string));
    if (freeAgent === "true") players = players.filter((p) => p.isFreeAgent);
    if (position) players = players.filter((p) => p.position === position);
    if (maxAge) players = players.filter((p) => p.age <= parseInt(maxAge as string));
    if (minOverall) players = players.filter((p) => p.overall >= parseInt(minOverall as string));

    const clubs = await db.select().from(gfcClubsTable);
    const clubMap = new Map(clubs.map((c) => [c.id, c.name]));
    res.json(players.map((p) => mapPlayer(p, p.clubId ? (clubMap.get(p.clubId) ?? null) : null)));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [player] = await db.select().from(gfcPlayersTable).where(eq(gfcPlayersTable.id, id));
    if (!player) return res.status(404).json({ error: "Player not found" });
    let clubName: string | null = null;
    if (player.clubId) {
      const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.id, player.clubId));
      clubName = club?.name ?? null;
    }
    res.json(mapPlayer(player, clubName));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
