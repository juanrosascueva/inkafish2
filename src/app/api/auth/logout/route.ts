import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session_token");
  return response;
}

