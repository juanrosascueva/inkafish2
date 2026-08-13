import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const waste = await convexClient.query(api.waste.list, {});
    return NextResponse.json({ waste });
  } catch (error) {
    return NextResponse.json({ waste: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      productId,
      unitId,
      quantity,
      stage,
      cause,
      areaId,
      siteId,
      warehouseId,
      costEstimate,
      actionTaken,
      notes,
    } = body;

    if (!productId || !unitId || !quantity || !stage || !cause || !siteId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const wasteId = await convexClient.mutation(api.waste.create, {
      productId,
      unitId,
      quantity: qty,
      stage,
      cause,
      areaId: areaId || undefined,
      siteId,
      warehouseId: warehouseId || undefined,
      recordedBy: session.id as any,
      costEstimate: costEstimate ? parseFloat(costEstimate) : undefined,
      actionTaken,
      notes,
    });

    return NextResponse.json({ ok: true, wasteId }, { status: 201 });
  } catch (error) {
    console.error("Waste record error:", error);
    return NextResponse.json({ error: "Error al registrar merma" }, { status: 500 });
  }
}

