import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json({ notifications: result });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { markAllRead } = body;

  if (markAllRead) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, session.id), eq(notifications.read, false)));
  }

  return NextResponse.json({ ok: true });
}
