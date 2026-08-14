import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // balances | movements | lots

  try {
    const [products, sites, warehouses, units] = await Promise.all([
      convexClient.query(api.products.list, {}),
      convexClient.query(api.master.getSites, {}),
      convexClient.query(api.master.getWarehouses, {}),
      convexClient.query(api.master.getUnits, {}),
    ]);

    const prodMap = new Map((products as any[]).map((p) => [p._id, p]));
    const siteMap = new Map((sites as any[]).map((s) => [s._id, s]));
    const whMap = new Map((warehouses as any[]).map((w) => [w._id, w]));
    const unitMap = new Map((units as any[]).map((u) => [u._id, u]));

    if (type === "movements") {
      const rawMovements: any[] = await convexClient.query(api.inventory.getMovements, {});
      const movements = rawMovements.map((m) => {
        const prod = prodMap.get(m.productId);
        const unit = unitMap.get(m.unitId) || (prod ? unitMap.get(prod.unitId) : null);
        return {
          id: m._id,
          movementType: m.movementType,
          quantity: m.quantity,
          referenceType: m.referenceType,
          referenceId: m.referenceId,
          reason: m.reason,
          createdAt: m.createdAt,
          product: prod ? { id: prod._id, name: prod.name, code: prod.code } : null,
          unit: unit ? { id: unit._id, symbol: unit.symbol } : null,
          site: siteMap.get(m.siteId) ? { id: m.siteId, name: siteMap.get(m.siteId).name } : null,
        };
      });
      return NextResponse.json({ movements });
    }

    if (type === "lots") {
      const rawLots: any[] = await convexClient.query(api.inventory.getLotsByFEFO, {});
      const lots = rawLots.map((l) => {
        const prod = prodMap.get(l.productId);
        return {
          id: l._id,
          lotNumber: l.lotNumber,
          receivedQuantity: l.receivedQuantity,
          remainingQuantity: l.remainingQuantity,
          receivedAt: l.receivedAt,
          expiresAt: l.expiresAt,
          active: l.active,
          product: prod ? { id: prod._id, name: prod.name, code: prod.code } : null,
          site: siteMap.get(l.siteId) ? { id: l.siteId, name: siteMap.get(l.siteId).name } : null,
          warehouse: whMap.get(l.warehouseId) ? { id: l.warehouseId, name: whMap.get(l.warehouseId).name } : null,
        };
      });
      return NextResponse.json({ lots });
    }

    const rawBalances: any[] = await convexClient.query(api.inventory.getBalances, {});
    const balances = rawBalances.map((b) => {
      const prod = prodMap.get(b.productId);
      const unit = prod ? unitMap.get(prod.unitId) : null;
      return {
        id: b._id,
        quantity: b.quantity,
        updatedAt: b.updatedAt,
        product: prod ? { id: prod._id, name: prod.name, code: prod.code, minStock: prod.minStock } : null,
        site: siteMap.get(b.siteId) ? { id: b.siteId, name: siteMap.get(b.siteId).name } : null,
        warehouse: whMap.get(b.warehouseId) ? { id: b.warehouseId, name: whMap.get(b.warehouseId).name } : null,
        unit: unit ? { id: unit._id, name: unit.name, symbol: unit.symbol } : null,
      };
    });

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error fetching inventory data from Convex:", error);
    return NextResponse.json({ balances: [], movements: [], lots: [] });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ["ADMIN", "WAREHOUSE", "CHEF"]);
  if ("response" in authResult) return authResult.response;

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

    const isNegative = [
      "DISCARD",
      "CONSUMPTION",
      "WAREHOUSE_EXIT",
      "WASTE_ENTRY",
      "TRANSFER_OUT",
      "ADJUSTMENT_NEGATIVE",
    ].includes(movementType);

    if (isNegative) {
      // Usar la Mutación Atómica FEFO
      const result = await convexClient.mutation(api.inventory.consumeStockFEFO, {
        productId: productId as any,
        siteId: siteId as any,
        warehouseId: warehouseId ? (warehouseId as any) : undefined,
        quantityToConsume: qty,
        unitId: unitId as any,
        movementType,
        createdBy: session.id as any,
        reason: reason || undefined,
      });

      return NextResponse.json({ ok: true, result }, { status: 201 });
    }

    // Para entradas positivas de stock
    const movementId = await convexClient.mutation(api.inventory.recordMovement, {
      movementType,
      productId: productId as any,
      quantity: qty,
      unitId: unitId as any,
      siteId: siteId as any,
      warehouseId: warehouseId ? (warehouseId as any) : undefined,
      locationId: locationId ? (locationId as any) : undefined,
      lotId: lotId ? (lotId as any) : undefined,
      createdBy: session.id as any,
      reason: reason || undefined,
    });

    return NextResponse.json({ ok: true, movementId }, { status: 201 });
  } catch (error: any) {
    console.error("Inventory entry error:", error);
    return NextResponse.json({ error: error.message || "Error al registrar movimiento" }, { status: 500 });
  }
}
