import { db } from "@workspace/db";
import { gfcUsersTable, gfcClubsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

export async function getGfcUser(clerkId: string) {
  const [user] = await db.select().from(gfcUsersTable).where(eq(gfcUsersTable.clerkId, clerkId));
  return user ?? null;
}

export async function getGfcClubByUser(user: { id: string; role: string }) {
  if (user.role === "owner") {
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.ownerId, user.id));
    return club ?? null;
  }
  if (user.role === "coach") {
    const [club] = await db.select().from(gfcClubsTable).where(eq(gfcClubsTable.coachId, user.id));
    return club ?? null;
  }
  return null;
}
