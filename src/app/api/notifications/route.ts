import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ notifications: [], unreadCount: 0 });
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
