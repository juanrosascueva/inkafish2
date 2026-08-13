import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  productionOrders,
  productionInputs,
  productionOutputs,
  wasteRecords,
  sites,
  areas,
  users,
  products,
  units,
  inventoryMovements,
  inventoryBalances,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = db
    .select({
      id: productionOrders.id,
      productionOrderNumber: productionOrders.productionOrderNumber,
      status: productionOrders.status,
      plannedDate: productionOrders.plannedDate,
      shift: productionOrders.shift,
      totalInputQuantity: productionOrders.totalInputQuantity,
      totalOutputQuantity: productionOrders.totalOutputQuantity,
      wasteQuantity: productionOrders.wasteQuantity,
      yieldPercentage: productionOrders.yieldPercentage,
      startedAt: productionOrders.startedAt,
      completedAt: productionOrders.completedAt,
      notes: productionOrders.notes,
      createdAt: productionOrders.createdAt,
      site: { id: sites.id, name: sites.name },
      area: { id: areas.id, name: areas.name },
      createdByUser: { id: users.id, name: users.name },
    })
    .from(productionOrders)
    .leftJoin(sites, eq(productionOrders.siteId, sites.id))
    .leftJoin(areas, eq(productionOrders.productionAreaId, areas.id))
    .leftJoin(users, eq(productionOrders.createdBy, users.id))
    .orderBy(desc(productionOrders.createdAt))
    .$dynamic();

  if (status) {
    query = query.where(eq(productionOrders.status, status as "DRAFT"));
  }

  const result = await query.limit(100);
  return NextResponse.json({ orders: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["GERENCIA", "ADMINISTRACION", "PRODUCCION", "CHEF_EJECUTIVA"].includes(session.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      siteId,
      productionAreaId,
      plannedDate,
      shift,
      notes,
      inputs,
      outputs,
    } = body;

    if (!siteId || !plannedDate || !inputs?.length || !outputs?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const [order] = await db
      .insert(productionOrders)
      .values({
        productionOrderNumber: `OP-${Date.now()}`,
        siteId: parseInt(siteId),
        productionAreaId: productionAreaId ? parseInt(productionAreaId) : null,
        plannedDate,
        shift,
        notes,
        status: "PLANNED",
        createdBy: session.id,
      })
      .returning();

    await db
      .update(productionOrders)
      .set({ productionOrderNumber: generateCode("OP", order.id) })
      .where(eq(productionOrders.id, order.id));

    if (inputs?.length) {
      await db.insert(productionInputs).values(
        inputs.map((inp: { productId: number; unitId: number; plannedQuantity: number; warehouseId?: number }) => ({
          productionOrderId: order.id,
          productId: inp.productId,
          unitId: inp.unitId,
          warehouseId: inp.warehouseId ?? null,
          plannedQuantity: String(inp.plannedQuantity),
        }))
      );
    }

    if (outputs?.length) {
      await db.insert(productionOutputs).values(
        outputs.map((out: { outputProductId: number; unitId: number; quantity: number; destinationWarehouseId?: number }) => ({
          productionOrderId: order.id,
          outputProductId: out.outputProductId,
          unitId: out.unitId,
          destinationWarehouseId: out.destinationWarehouseId ?? null,
          quantity: String(out.quantity),
        }))
      );
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Production order create error:", error);
    return NextResponse.json({ error: "Error al crear orden de producción" }, { status: 500 });
  }
}
