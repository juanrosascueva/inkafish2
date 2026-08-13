import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // balances | movements | lots

  try {
    if (type === "movements") {
      const movements = await convexClient.query(api.inventory.getMovements, {});
      return NextResponse.json({ movements });
    }

    if (type === "lots") {
      const lots = await convexClient.query(api.inventory.getLotsByFEFO, { productId: "" as any });
      return NextResponse.json({ lots });
    }

    const balances = await convexClient.query(api.inventory.getBalances, {});
    return NextResponse.json({ balances });
  } catch (error) {
    return NextResponse.json({ balances: [], movements: [], lots: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      productId,
      quantity,
      unitId,
      siteId,
      warehouseId,
      locationId,
      movementType,
      reason,
      lotId,
    } = body;

    if (!productId || !quantity || !unitId || !siteId || !movementType) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const movementId = await convexClient.mutation(api.inventory.recordMovement, {
      movementType,
      productId,
      quantity: qty,
      unitId,
      siteId,
      warehouseId: warehouseId || undefined,
      locationId: locationId || undefined,
      lotId: lotId || undefined,
      createdBy: session.id as any,
      reason,
    });

    return NextResponse.json({ ok: true, movementId }, { status: 201 });
  } catch (error) {
    console.error("Inventory entry error:", error);
    return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 });
  }
}

