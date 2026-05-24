import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, clubsTable, gameStateTable, transfersTable, inboxTable } from "@workspace/db";
import { eq, and, ne, lte } from "drizzle-orm";
import { MakeTransferOfferBody, FmGetTransferMarketQueryParams } from "@workspace/api-zod";
import { getWeekDate } from "../lib/gameEngine";

const router = Router();

router.get("/fm/transfers/market", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const qp = FmGetTransferMarketQueryParams.safeParse(req.query);
  const positionFilter = qp.success ? qp.data.position : undefined;
  const maxValueFilter = qp.success ? qp.data.maxValue : undefined;

  // Get players from other clubs who are on the transfer list
  let players = await db
    .select()
    .from(playersTable)
    .where(
      and(
        ne(playersTable.clubId, state.clubId),
        eq(playersTable.isOnTransferList, true),
      ),
    );

  if (positionFilter) {
    players = players.filter(p => p.position === positionFilter);
  }
  if (maxValueFilter) {
    players = players.filter(p => p.value <= maxValueFilter);
  }

  const allClubs = await db.select({ id: clubsTable.id, name: clubsTable.name }).from(clubsTable);
  const clubMap = Object.fromEntries(allClubs.map(c => [c.id, c.name]));

  return res.json(players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    age: p.age,
    nationality: p.nationality,
    position: p.position,
    overall: p.overall,
    clubId: p.clubId,
    clubName: clubMap[p.clubId] ?? "Unknown",
    askingPrice: Math.floor(p.value * 1.15),
    weeklySalary: p.weeklySalary,
    contractEndsYear: p.contractEndsYear,
  })));
});

router.post("/fm/transfers/offer", async (req, res) => {
  const parse = MakeTransferOfferBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { playerId, offerAmount, offeredSalary } = parse.data;

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, playerId));
  if (!player) return res.status(404).json({ error: "Player not found" });

  const [myClub] = await db.select().from(clubsTable).where(eq(clubsTable.id, state.clubId));
  const [fromClub] = await db.select().from(clubsTable).where(eq(clubsTable.id, player.clubId));
  if (!myClub || !fromClub) return res.status(400).json({ error: "Club not found" });

  const askingPrice = Math.floor(player.value * 1.15);

  // Check if we can afford it
  if (offerAmount > myClub.budget) {
    return res.json({
      success: false,
      message: `Offer rejected. Your budget of £${(myClub.budget / 1000).toFixed(1)}M is insufficient to meet the asking price.`,
    });
  }

  // Determine if offer is accepted (>= 90% of asking price)
  const offerRatio = offerAmount / askingPrice;
  const accepted = offerRatio >= 0.9;

  if (!accepted) {
    return res.json({
      success: false,
      message: `${fromClub.name} rejected your offer of £${(offerAmount / 1000).toFixed(1)}M for ${player.name}. Their asking price is £${(askingPrice / 1000).toFixed(1)}M.`,
    });
  }

  // Transfer the player
  await db.update(playersTable).set({
    clubId: state.clubId,
    weeklySalary: offeredSalary,
    isOnTransferList: false,
    morale: "good",
  }).where(eq(playersTable.id, playerId));

  // Deduct from budget
  await db.update(clubsTable).set({
    budget: myClub.budget - offerAmount,
    transferSpend: myClub.transferSpend + offerAmount,
  }).where(eq(clubsTable.id, state.clubId));

  // Add to selling club budget
  await db.update(clubsTable).set({
    budget: fromClub.budget + offerAmount,
    transferIncome: fromClub.transferIncome + offerAmount,
  }).where(eq(clubsTable.id, fromClub.id));

  // Record the transfer
  const currentDate = state.currentDate ?? getWeekDate(2026, state.currentWeek);
  await db.insert(transfersTable).values({
    playerId,
    playerName: player.name,
    fromClubId: fromClub.id,
    fromClubName: fromClub.name,
    toClubId: state.clubId,
    toClubName: myClub.name,
    fee: offerAmount,
    date: currentDate,
    type: "purchase",
  });

  // Inbox message
  await db.insert(inboxTable).values({
    clubId: state.clubId,
    date: currentDate,
    subject: `Transfer complete: ${player.name} joins the club`,
    body: `${player.name} has signed for the club from ${fromClub.name} for £${(offerAmount / 1000).toFixed(1)}M on a salary of £${offeredSalary}k per week. Welcome to the club!`,
    type: "transfer",
    isRead: false,
  });

  const [updatedPlayer] = await db.select().from(playersTable).where(eq(playersTable.id, playerId));

  return res.json({
    success: true,
    message: `${player.name} has signed from ${fromClub.name} for £${(offerAmount / 1000).toFixed(1)}M!`,
    player: updatedPlayer ? {
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      age: updatedPlayer.age,
      nationality: updatedPlayer.nationality,
      position: updatedPlayer.position,
      overall: updatedPlayer.overall,
      potential: updatedPlayer.potential,
      attributes: {
        pace: updatedPlayer.pace, shooting: updatedPlayer.shooting, passing: updatedPlayer.passing,
        dribbling: updatedPlayer.dribbling, defending: updatedPlayer.defending,
        physicality: updatedPlayer.physicality, goalkeeping: updatedPlayer.goalkeeping,
      },
      form: updatedPlayer.form,
      fitness: updatedPlayer.fitness,
      morale: updatedPlayer.morale,
      value: updatedPlayer.value,
      weeklySalary: updatedPlayer.weeklySalary,
      contractEndsYear: updatedPlayer.contractEndsYear,
      seasonGoals: updatedPlayer.seasonGoals,
      seasonAssists: updatedPlayer.seasonAssists,
      clubId: updatedPlayer.clubId,
      isOnTransferList: updatedPlayer.isOnTransferList,
    } : null,
  });
});

router.get("/fm/transfers", async (_req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const transfers = await db
    .select()
    .from(transfersTable)
    .where(
      and(
        eq(transfersTable.toClubId, state.clubId),
      ),
    );

  return res.json(transfers.map(t => ({
    id: t.id,
    playerId: t.playerId,
    playerName: t.playerName,
    fromClubId: t.fromClubId,
    fromClubName: t.fromClubName,
    toClubId: t.toClubId,
    toClubName: t.toClubName,
    fee: t.fee,
    date: t.date,
    type: t.type,
  })));
});

export default router;
