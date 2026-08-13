import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (token) {
    await deleteSession(token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session_token");
  return response;
}
