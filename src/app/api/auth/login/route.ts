import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { createSession, verifyPassword } from "@/lib/auth";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  let step = "start";
  const debugLog: any = {};

  try {
    step = "parse_json";
    const body = await req.json();
    const { email, password } = body;
    debugLog.email = email;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    step = "clean_url";
    const rawUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const cleanUrl = (rawUrl || "https://successful-stingray-319.convex.cloud")
      .replace(/[\r\n"'\s]/g, "")
      .trim();
    debugLog.rawUrl = rawUrl;
    debugLog.cleanUrl = cleanUrl;

    step = "create_client";
    const client = new ConvexHttpClient(cleanUrl);

    step = "query_user";
    const user: any = await client.query(api.auth.getUserByEmail, {
      email: email.trim().toLowerCase(),
    });
    debugLog.userFound = !!user;

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    step = "verify_password";
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    step = "create_session";
    const token = await createSession(user._id);

    step = "create_response";
    const response = NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        siteId: user.siteId ?? null,
        areaId: user.areaId ?? null,
      },
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error at step:", step, error);
    return NextResponse.json(
      {
        error: error?.message || String(error),
        failedAtStep: step,
        debugLog,
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
