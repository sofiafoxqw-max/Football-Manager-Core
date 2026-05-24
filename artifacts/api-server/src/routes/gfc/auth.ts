import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { gfcUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../lib/requireAuth";
import { randomUUID } from "crypto";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const clerkId = req.clerkUserId;
    const [user] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.clerkId, clerkId));
    if (!user) {
      return res.json({
        id: clerkId,
        clerkId,
        displayName: "",
        role: "unregistered",
        balance: 10000000,
        reputation: 50,
        clubId: null,
        clubName: null,
        createdAt: new Date().toISOString(),
      });
    }
    return res.json({
      id: user.id,
      clerkId: user.clerkId,
      displayName: user.displayName,
      role: user.role,
      balance: user.balance,
      reputation: user.reputation,
      clubId: null,
      clubName: null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", requireAuth, async (req: any, res) => {
  try {
    const clerkId = req.clerkUserId;
    const { displayName, role } = req.body;
    if (!displayName || !["owner", "coach"].includes(role)) {
      return res.status(400).json({ error: "Invalid displayName or role" });
    }
    const existing = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.clerkId, clerkId));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Already registered" });
    }
    const id = randomUUID();
    const [user] = await db.insert(gfcUsersTable).values({
      id,
      clerkId,
      displayName,
      role,
      balance: 10000000,
      reputation: 50,
    }).returning();
    return res.status(201).json({
      id: user.id,
      clerkId: user.clerkId,
      displayName: user.displayName,
      role: user.role,
      balance: user.balance,
      reputation: user.reputation,
      clubId: null,
      clubName: null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
