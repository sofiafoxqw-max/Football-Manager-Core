import { Router } from "express";
import { db } from "@workspace/db";
import { setPiecesTable, gameStateTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_ROUTINES = [
  { type: "corner_attack", routine: "Inswinger to near post", takerId: null, takerName: null, targetArea: "near_post" },
  { type: "corner_defend", routine: "Zonal marking", takerId: null, takerName: null, targetArea: "penalty_spot" },
  { type: "freekick_attack", routine: "Direct shot", takerId: null, takerName: null, targetArea: "edge_of_box" },
  { type: "freekick_defend", routine: "Wall + goalkeeper", takerId: null, takerName: null, targetArea: "penalty_spot" },
  { type: "throwIn", routine: "Quick throw to nearest player", takerId: null, takerName: null, targetArea: "short" },
];

router.get("/set-pieces", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  let [sp] = await db.select().from(setPiecesTable).where(eq(setPiecesTable.clubId, state.clubId));
  if (!sp) {
    await db.insert(setPiecesTable).values({ clubId: state.clubId, routines: DEFAULT_ROUTINES });
    [sp] = await db.select().from(setPiecesTable).where(eq(setPiecesTable.clubId, state.clubId));
  }

  return res.json({ routines: sp.routines });
});

router.put("/set-pieces", async (req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const { routines } = req.body as { routines: unknown[] };

  const [existing] = await db.select().from(setPiecesTable).where(eq(setPiecesTable.clubId, state.clubId));
  if (existing) {
    await db.update(setPiecesTable).set({ routines }).where(eq(setPiecesTable.clubId, state.clubId));
  } else {
    await db.insert(setPiecesTable).values({ clubId: state.clubId, routines });
  }

  return res.json({ routines });
});

export default router;
