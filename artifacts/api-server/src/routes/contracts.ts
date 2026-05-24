import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, gameStateTable, inboxTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { getWeekDate } from "../lib/gameEngine";

const router = Router();

router.get("/fm/contracts", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const currentYear = state.season;
  const players = await db.select().from(playersTable)
    .where(and(eq(playersTable.clubId, state.clubId), lte(playersTable.contractEndsYear, currentYear + 2)));

  return res.json(players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    position: p.position,
    overall: p.overall,
    age: p.age,
    currentSalary: p.weeklySalary,
    contractEndsYear: p.contractEndsYear,
    morale: p.morale,
    wantsToLeave: p.isOnTransferList,
  })));
});

router.post("/fm/contracts/:playerId/offer", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const playerId = Number(req.params.playerId);
  const { weeklySalary, yearsLength } = req.body as { weeklySalary: number; yearsLength: number };

  const [player] = await db.select().from(playersTable)
    .where(and(eq(playersTable.id, playerId), eq(playersTable.clubId, state.clubId)));
  if (!player) return res.status(404).json({ error: "Player not found" });

  const minAcceptable = Math.round(player.weeklySalary * 0.9);
  const accepted = weeklySalary >= minAcceptable && yearsLength >= 1 && yearsLength <= 5;

  if (accepted) {
    const newEndYear = state.season + yearsLength;
    await db.update(playersTable).set({
      weeklySalary,
      contractEndsYear: newEndYear,
      morale: "happy",
      isOnTransferList: false,
    }).where(eq(playersTable.id, playerId));

    await db.insert(inboxTable).values({
      clubId: state.clubId,
      date: getWeekDate(state.season, state.currentWeek ?? 1),
      subject: `Contract Renewal: ${player.name} Signs New Deal`,
      body: `${player.name} has agreed to a new ${yearsLength}-year contract worth £${weeklySalary.toLocaleString()}pw. The player is delighted to commit his future to the club.`,
      type: "contract",
      isRead: false,
    });

    return res.json({ success: true, message: `${player.name} accepted the contract offer.`, newContractEndsYear: newEndYear, newWeeklySalary: weeklySalary });
  } else {
    const reason = weeklySalary < minAcceptable
      ? `The salary offer is too low. ${player.name} expects at least £${minAcceptable.toLocaleString()}pw.`
      : "The contract length is not acceptable.";

    await db.insert(inboxTable).values({
      clubId: state.clubId,
      date: getWeekDate(state.season, state.currentWeek ?? 1),
      subject: `Contract Rejected: ${player.name} Turns Down Offer`,
      body: `${player.name} has rejected your contract renewal offer. ${reason}`,
      type: "contract",
      isRead: false,
    });

    return res.json({ success: false, message: reason, newContractEndsYear: null, newWeeklySalary: null });
  }
});

export default router;
