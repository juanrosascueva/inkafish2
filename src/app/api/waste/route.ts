import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  wasteRecords,
  products,
  units,
  areas,
  sites,
  users,
  inventoryMovements,
  inventoryBalances,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: wasteRecords.id,
      quantity: wasteRecords.quantity,
      stage: wasteRecords.stage,
      cause: wasteRecords.cause,
      consumesStock: wasteRecords.consumesStock,
      occurredAt: wasteRecords.occurredAt,
      notes: wasteRecords.notes,
      createdAt: wasteRecords.createdAt,
      product: { id: products.id, name: products.name, code: products.code },
      unit: { id: units.id, name: units.name, symbol: units.symbol },
      area: { id: areas.id, name: areas.name },
      site: { id: sites.id, name: sites.name },
      responsibleUser: { id: users.id, name: users.name },
    })
    .from(wasteRecords)
    .leftJoin(products, eq(wasteRecords.productId, products.id))
    .leftJoin(units, eq(wasteRecords.unitId, units.id))
    .leftJoin(areas, eq(wasteRecords.areaId, areas.id))
    .leftJoin(sites, eq(wasteRecords.siteId, sites.id))
    .leftJoin(users, eq(wasteRecords.responsibleUserId, users.id))
    .orderBy(desc(wasteRecords.createdAt))
    .limit(200);

  return NextResponse.json({ waste: result });
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
      locationId,
      productionOrderId,
      occurredAt,
      notes,
    } = body;

    if (!productId || !unitId || !quantity || !stage || !cause || !siteId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    // Determine if it consumes stock
    // If it's linked to production, stock was already consumed. Otherwise it's a warehouse waste.
    const consumesStock = !productionOrderId;

    const [waste] = await db
      .insert(wasteRecords)
      .values({
        productId: parseInt(productId),
        unitId: parseInt(unitId),
        quantity: String(qty),
        stage,
        cause,
        areaId: areaId ? parseInt(areaId) : null,
        siteId: parseInt(siteId),
        warehouseId: warehouseId ? parseInt(warehouseId) : null,
        locationId: locationId ? parseInt(locationId) : null,
        productionOrderId: productionOrderId ? parseInt(productionOrderId) : null,
        responsibleUserId: session.id,
        consumesStock,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        notes,
      })
      .returning();

    // If consumesStock, create inventory movement
    if (consumesStock) {
      await db.insert(inventoryMovements).values({
        movementType: "WASTE",
        productId: parseInt(productId),
        quantity: String(-qty),
        unitId: parseInt(unitId),
        siteId: parseInt(siteId),
        warehouseId: warehouseId ? parseInt(warehouseId) : null,
        referenceType: "waste",
        referenceId: waste.id,
        createdBy: session.id,
        reason: cause,
      });

      // Update balance
      const [bal] = await db
        .select()
        .from(inventoryBalances)
        .where(
          and(
            eq(inventoryBalances.productId, parseInt(productId)),
            eq(inventoryBalances.siteId, parseInt(siteId))
          )
        )
        .limit(1);

      if (bal) {
        await db
          .update(inventoryBalances)
          .set({
            quantity: String(Math.max(0, parseFloat(bal.quantity ?? "0") - qty)),
            updatedAt: new Date(),
          })
          .where(eq(inventoryBalances.id, bal.id));
      }
    }

    return NextResponse.json({ waste }, { status: 201 });
  } catch (error) {
    console.error("Waste record error:", error);
    return NextResponse.json({ error: "Error al registrar merma" }, { status: 500 });
  }
}
