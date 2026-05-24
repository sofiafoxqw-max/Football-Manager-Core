import { Router } from "express";
import { db } from "@workspace/db";
import { inboxTable, gameStateTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { MarkMessageReadParams } from "@workspace/api-zod";

const router = Router();

router.get("/inbox", async (_req, res) => {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  const messages = await db
    .select()
    .from(inboxTable)
    .where(eq(inboxTable.clubId, state.clubId))
    .orderBy(desc(inboxTable.id));

  return res.json(messages.map(m => ({
    id: m.id,
    date: m.date,
    subject: m.subject,
    body: m.body,
    type: m.type,
    isRead: m.isRead,
  })));
});

router.post("/inbox/:id/read", async (req, res) => {
  const parse = MarkMessageReadParams.safeParse({ id: Number(req.params.id) });
  if (!parse.success) return res.status(400).json({ error: "Invalid message id" });

  const [state] = await db.select().from(gameStateTable).limit(1);
  if (!state?.clubId) return res.status(400).json({ error: "No active game" });

  await db.update(inboxTable).set({ isRead: true }).where(
    and(eq(inboxTable.id, parse.data.id), eq(inboxTable.clubId, state.clubId)),
  );

  const [msg] = await db.select().from(inboxTable).where(eq(inboxTable.id, parse.data.id));
  if (!msg) return res.status(404).json({ error: "Message not found" });

  return res.json({
    id: msg.id,
    date: msg.date,
    subject: msg.subject,
    body: msg.body,
    type: msg.type,
    isRead: msg.isRead,
  });
});

export default router;
