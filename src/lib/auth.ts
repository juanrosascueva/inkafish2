import { cookies } from "next/headers";
import { db, ensureDbReady } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, gt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  siteId: number | null;
  areaId: number | null;
};

export async function getSession(): Promise<SessionUser | null> {
  await ensureDbReady();
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      siteId: users.siteId,
      areaId: users.areaId,
      active: users.active,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  const session = result[0];
  if (!session || !session.active) return null;

  return {
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role,
    siteId: session.siteId,
    areaId: session.areaId,
  };
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({ userId, token, expiresAt });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
