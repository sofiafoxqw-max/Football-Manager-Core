import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { gfcUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../../lib/requireAuth";
import { randomUUID } from "crypto";

const router = Router();

function userResponse(user: typeof gfcUsersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    balance: user.balance,
    reputation: user.reputation,
    clubId: null,
    clubName: null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Пароль должен быть не менее 6 символов" });
    }
    const existing = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Этот email уже зарегистрирован" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const [user] = await db.insert(gfcUsersTable).values({
      id,
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: "",
      role: "unregistered",
      balance: 10000000,
      reputation: 50,
    }).returning();
    const token = signToken(user.id);
    return res.status(201).json({ token, user: userResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    const [user] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.email, email.toLowerCase().trim()));
    if (!user) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const token = signToken(user.id);
    return res.json({ token, user: userResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.id, req.gfcUserId));
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    return res.json(userResponse(user));
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

router.post("/register", requireAuth, async (req: any, res) => {
  try {
    const { displayName, role } = req.body;
    if (!displayName || !["owner", "coach"].includes(role)) {
      return res.status(400).json({ error: "Неверное имя или роль" });
    }
    const [existing] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.id, req.gfcUserId));
    if (!existing) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    if (existing.role !== "unregistered") {
      return res.status(400).json({ error: "Уже зарегистрирован" });
    }
    const [user] = await db.update(gfcUsersTable)
      .set({ displayName, role, updatedAt: new Date() })
      .where(eq(gfcUsersTable.id, req.gfcUserId))
      .returning();
    return res.status(201).json(userResponse(user));
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

export default router;
