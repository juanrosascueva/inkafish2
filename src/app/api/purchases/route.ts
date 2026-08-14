import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawPurchases: any[] = await convexClient.query(api.purchases.list, {});
    const purchases = rawPurchases.map((p) => ({
      id: p._id,
      purchaseNumber: p.purchaseNumber,
      status: p.status,
      expectedDate: p.expectedDate,
      documentNumber: p.documentNumber,
      totalAmount: p.totalAmount,
      currency: p.currency,
      createdAt: p.createdAt,
    }));
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Error fetching purchases from Convex:", error);
    return NextResponse.json({ purchases: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = await convexClient.mutation(api.purchases.create, {
      ...body,
      requestedBy: session.id as any,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al registrar compra" }, { status: 500 });
  }
}
