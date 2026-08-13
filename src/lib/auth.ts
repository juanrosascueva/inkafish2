import { cookies } from "next/headers";
import { convexClient } from "./convex-client";
import { api } from "../../convex/_generated/api";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  siteId: string | null;
  areaId: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  try {
    const authResult: any = await convexClient.query(api.auth.getSession, { token });
    if (!authResult || !authResult.user) return null;

    const { user } = authResult;
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      siteId: user.siteId ?? null,
      areaId: user.areaId ?? null,
    };
  } catch (error) {
    console.error("Error al obtener sesión de Convex:", error);
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 días

  await convexClient.mutation(api.auth.createSession, {
    userId: userId as any,
    token,
    expiresAt,
  });

  return token;
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

