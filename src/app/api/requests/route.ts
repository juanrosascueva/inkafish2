import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawRequests: any[] = await convexClient.query(api.requests.list, {});
    const requests = rawRequests.map((r) => ({
      id: r._id,
      requestNumber: r.requestNumber,
      status: r.status,
      priority: r.priority,
      requiredDate: r.requiredDate,
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching requests from Convex:", error);
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = await convexClient.mutation(api.requests.create, {
      ...body,
      requestedBy: session.id as any,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 });
  }
}
