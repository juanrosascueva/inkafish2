import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  inventoryBalances,
  inventoryMovements,
  products,
  sites,
  warehouses,
  locations,
  units,
  lots,
} from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { canManageInventory } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");
  const warehouseId = searchParams.get("warehouseId");
  const type = searchParams.get("type"); // balances | movements | lots

  if (type === "movements") {
    const movements = await db
      .select({
        id: inventoryMovements.id,
        movementType: inventoryMovements.movementType,
        quantity: inventoryMovements.quantity,
        referenceType: inventoryMovements.referenceType,
        referenceId: inventoryMovements.referenceId,
        reason: inventoryMovements.reason,
        createdAt: inventoryMovements.createdAt,
        product: { id: products.id, name: products.name, code: products.code },
        unit: { id: units.id, symbol: units.symbol },
        site: { id: sites.id, name: sites.name },
      })
      .from(inventoryMovements)
      .leftJoin(products, eq(inventoryMovements.productId, products.id))
      .leftJoin(units, eq(inventoryMovements.unitId, units.id))
      .leftJoin(sites, eq(inventoryMovements.siteId, sites.id))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(100);
    return NextResponse.json({ movements });
  }

  if (type === "lots") {
    let query = db
      .select({
        id: lots.id,
        lotNumber: lots.lotNumber,
        receivedQuantity: lots.receivedQuantity,
        remainingQuantity: lots.remainingQuantity,
        receivedAt: lots.receivedAt,
        expiresAt: lots.expiresAt,
        active: lots.active,
        product: { id: products.id, name: products.name, code: products.code },
        site: { id: sites.id, name: sites.name },
        warehouse: { id: warehouses.id, name: warehouses.name },
      })
      .from(lots)
      .leftJoin(products, eq(lots.productId, products.id))
      .leftJoin(sites, eq(lots.siteId, sites.id))
      .leftJoin(warehouses, eq(lots.warehouseId, warehouses.id))
      .orderBy(lots.expiresAt)
      .$dynamic();

    const conditions = [];
    if (siteId) conditions.push(eq(lots.siteId, parseInt(siteId)));
    if (conditions.length > 0) query = query.where(and(...conditions));

    const result = await query.limit(200);
    return NextResponse.json({ lots: result });
  }

  // Default: balances
  let query = db
    .select({
      id: inventoryBalances.id,
      quantity: inventoryBalances.quantity,
      updatedAt: inventoryBalances.updatedAt,
      product: { id: products.id, name: products.name, code: products.code, minStock: products.minStock },
      site: { id: sites.id, name: sites.name },
      warehouse: { id: warehouses.id, name: warehouses.name },
      unit: { id: units.id, name: units.name, symbol: units.symbol },
    })
    .from(inventoryBalances)
    .leftJoin(products, eq(inventoryBalances.productId, products.id))
    .leftJoin(sites, eq(inventoryBalances.siteId, sites.id))
    .leftJoin(warehouses, eq(inventoryBalances.warehouseId, warehouses.id))
    .leftJoin(units, eq(products.unitId, units.id))
    .$dynamic();

  const conditions = [];
  if (siteId) conditions.push(eq(inventoryBalances.siteId, parseInt(siteId)));
  if (warehouseId) conditions.push(eq(inventoryBalances.warehouseId, parseInt(warehouseId)));

  if (conditions.length > 0) query = query.where(and(...conditions));

  const result = await query.limit(500);
  return NextResponse.json({ balances: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageInventory(session.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

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
      lotNumber,
      expiresAt,
      supplierId,
    } = body;

    if (!productId || !quantity || !unitId || !siteId || !movementType) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    let lotId: number | null = null;

    // Create lot if needed
    if (lotNumber) {
      const [lot] = await db
        .insert(lots)
        .values({
          lotNumber,
          productId: parseInt(productId),
          warehouseId: warehouseId ? parseInt(warehouseId) : null,
          locationId: locationId ? parseInt(locationId) : null,
          siteId: parseInt(siteId),
          supplierId: supplierId ? parseInt(supplierId) : null,
          receivedQuantity: String(qty),
          remainingQuantity: String(qty),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();
      lotId = lot.id;
    }

    // Create movement
    await db.insert(inventoryMovements).values({
      movementType,
      productId: parseInt(productId),
      quantity: String(qty),
      unitId: parseInt(unitId),
      siteId: parseInt(siteId),
      warehouseId: warehouseId ? parseInt(warehouseId) : null,
      locationId: locationId ? parseInt(locationId) : null,
      lotId,
      referenceType: "manual",
      createdBy: session.id,
      reason,
    });

    // Update balance
    const isNegative = ["INTERNAL_DISPATCH", "TRANSFER_OUT", "PRODUCTION_CONSUMPTION", "WASTE", "ADJUSTMENT_NEGATIVE"].includes(movementType);
    const adjustedQty = isNegative ? -qty : qty;

    const conditions = [
      eq(inventoryBalances.productId, parseInt(productId)),
      eq(inventoryBalances.siteId, parseInt(siteId)),
    ];
    if (warehouseId) conditions.push(eq(inventoryBalances.warehouseId, parseInt(warehouseId)));

    const [existingBalance] = await db
      .select()
      .from(inventoryBalances)
      .where(and(...conditions))
      .limit(1);

    if (existingBalance) {
      await db
        .update(inventoryBalances)
        .set({
          quantity: String(parseFloat(existingBalance.quantity ?? "0") + adjustedQty),
          updatedAt: new Date(),
        })
        .where(eq(inventoryBalances.id, existingBalance.id));
    } else {
      await db.insert(inventoryBalances).values({
        productId: parseInt(productId),
        siteId: parseInt(siteId),
        warehouseId: warehouseId ? parseInt(warehouseId) : null,
        locationId: locationId ? parseInt(locationId) : null,
        lotId,
        quantity: String(Math.max(0, adjustedQty)),
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Inventory entry error:", error);
    return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 });
  }
}
