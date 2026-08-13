import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  let convexTestRes = "";
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    try {
      const testFetch = await fetch("https://successful-stingray-319.convex.cloud/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "auth:getUserByEmail", args: { email: email.trim().toLowerCase() } }),
      });
      convexTestRes = `status=${testFetch.status}, text=${(await testFetch.text()).slice(0, 100)}`;
    } catch (err: any) {
      convexTestRes = `fetch err=${err?.message}`;
    }

    const user: any = await convexClient.query(api.auth.getUserByEmail, {
      email: email.trim().toLowerCase(),
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = await createSession(user._id);

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
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: error?.message || String(error),
        convexTestRes,
        envUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
