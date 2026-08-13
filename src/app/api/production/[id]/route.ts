import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  productionOrders,
  productionInputs,
  productionOutputs,
  wasteRecords,
  products,
  units,
  warehouses,
  inventoryMovements,
  inventoryBalances,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);

  const [order] = await db
    .select()
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inputs = await db
    .select({
      id: productionInputs.id,
      plannedQuantity: productionInputs.plannedQuantity,
      actualQuantity: productionInputs.actualQuantity,
      product: { id: products.id, name: products.name, code: products.code },
      unit: { id: units.id, name: units.name, symbol: units.symbol },
    })
    .from(productionInputs)
    .leftJoin(products, eq(productionInputs.productId, products.id))
    .leftJoin(units, eq(productionInputs.unitId, units.id))
    .where(eq(productionInputs.productionOrderId, orderId));

  const outputs = await db
    .select({
      id: productionOutputs.id,
      quantity: productionOutputs.quantity,
      lotNumber: productionOutputs.lotNumber,
      expiresAt: productionOutputs.expiresAt,
      product: { id: products.id, name: products.name, code: products.code },
      unit: { id: units.id, name: units.name, symbol: units.symbol },
    })
    .from(productionOutputs)
    .leftJoin(products, eq(productionOutputs.outputProductId, products.id))
    .leftJoin(units, eq(productionOutputs.unitId, units.id))
    .where(eq(productionOutputs.productionOrderId, orderId));

  const wastes = await db
    .select({
      id: wasteRecords.id,
      quantity: wasteRecords.quantity,
      stage: wasteRecords.stage,
      cause: wasteRecords.cause,
      consumesStock: wasteRecords.consumesStock,
      product: { id: products.id, name: products.name },
      unit: { id: units.id, symbol: units.symbol },
    })
    .from(wasteRecords)
    .leftJoin(products, eq(wasteRecords.productId, products.id))
    .leftJoin(units, eq(wasteRecords.unitId, units.id))
    .where(eq(wasteRecords.productionOrderId, orderId));

  return NextResponse.json({ order, inputs, outputs, wastes });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  const body = await req.json();
  const { action, actualInputs, actualOutputs, wasteQuantity, wasteCause, notes } = body;

  const [order] = await db
    .select()
    .from(productionOrders)
    .where(eq(productionOrders.id, orderId));

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "start") {
    await db
      .update(productionOrders)
      .set({
        status: "IN_PROGRESS",
        startedBy: session.id,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(productionOrders.id, orderId));
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    // Update actual quantities on inputs
    if (actualInputs) {
      for (const inp of actualInputs) {
        await db
          .update(productionInputs)
          .set({ actualQuantity: String(inp.actualQuantity) })
          .where(and(eq(productionInputs.id, inp.id), eq(productionInputs.productionOrderId, orderId)));

        // Create inventory consumption movements
        const [input] = await db.select().from(productionInputs).where(eq(productionInputs.id, inp.id));
        if (input) {
          await db.insert(inventoryMovements).values({
            movementType: "PRODUCTION_CONSUMPTION",
            productId: input.productId,
            quantity: String(-Math.abs(inp.actualQuantity)),
            unitId: input.unitId,
            siteId: order.siteId,
            warehouseId: input.warehouseId,
            referenceType: "production_order",
            referenceId: orderId,
            createdBy: session.id,
            reason: `Consumo OP ${order.productionOrderNumber}`,
          });

          // Update balance
          const [bal] = await db
            .select()
            .from(inventoryBalances)
            .where(
              and(
                eq(inventoryBalances.productId, input.productId),
                eq(inventoryBalances.siteId, order.siteId)
              )
            )
            .limit(1);

          if (bal) {
            await db
              .update(inventoryBalances)
              .set({
                quantity: String(Math.max(0, parseFloat(bal.quantity ?? "0") - inp.actualQuantity)),
                updatedAt: new Date(),
              })
              .where(eq(inventoryBalances.id, bal.id));
          }
        }
      }
    }

    // Update actual output quantities
    let totalOutput = 0;
    if (actualOutputs) {
      for (const out of actualOutputs) {
        await db
          .update(productionOutputs)
          .set({ quantity: String(out.quantity) })
          .where(and(eq(productionOutputs.id, out.id), eq(productionOutputs.productionOrderId, orderId)));

        const [output] = await db.select().from(productionOutputs).where(eq(productionOutputs.id, out.id));
        if (output) {
          totalOutput += out.quantity;
          await db.insert(inventoryMovements).values({
            movementType: "PRODUCTION_OUTPUT",
            productId: output.outputProductId,
            quantity: String(out.quantity),
            unitId: output.unitId,
            siteId: order.siteId,
            warehouseId: output.destinationWarehouseId,
            referenceType: "production_order",
            referenceId: orderId,
            createdBy: session.id,
            reason: `Salida OP ${order.productionOrderNumber}`,
          });

          // Update balance for output
          const [bal] = await db
            .select()
            .from(inventoryBalances)
            .where(
              and(
                eq(inventoryBalances.productId, output.outputProductId),
                eq(inventoryBalances.siteId, order.siteId)
              )
            )
            .limit(1);

          if (bal) {
            await db
              .update(inventoryBalances)
              .set({
                quantity: String(parseFloat(bal.quantity ?? "0") + out.quantity),
                updatedAt: new Date(),
              })
              .where(eq(inventoryBalances.id, bal.id));
          } else {
            await db.insert(inventoryBalances).values({
              productId: output.outputProductId,
              siteId: order.siteId,
              warehouseId: output.destinationWarehouseId,
              quantity: String(out.quantity),
            });
          }
        }
      }
    }

    // Record waste (analytical, does NOT consume stock from warehouse since already consumed in inputs)
    const totalInput = actualInputs?.reduce((s: number, i: { actualQuantity: number }) => s + i.actualQuantity, 0) ?? 0;
    const waste = wasteQuantity ?? Math.max(0, totalInput - totalOutput);
    const yieldPct = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

    if (waste > 0 && actualInputs?.[0]) {
      const [firstInput] = await db.select().from(productionInputs).where(eq(productionInputs.productionOrderId, orderId)).limit(1);
      if (firstInput) {
        // consumesStock = false because material was already consumed via PRODUCTION_CONSUMPTION
        await db.insert(wasteRecords).values({
          productId: firstInput.productId,
          unitId: firstInput.unitId,
          quantity: String(waste),
          stage: "PRODUCTION",
          cause: wasteCause ?? "Merma de producción",
          siteId: order.siteId,
          productionOrderId: orderId,
          responsibleUserId: session.id,
          consumesStock: false, // Critical: no double discount
          occurredAt: new Date(),
          notes,
        });
      }
    }

    await db
      .update(productionOrders)
      .set({
        status: "COMPLETED",
        completedBy: session.id,
        completedAt: new Date(),
        totalInputQuantity: String(totalInput),
        totalOutputQuantity: String(totalOutput),
        wasteQuantity: String(waste),
        yieldPercentage: String(yieldPct.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(productionOrders.id, orderId));

    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    await db
      .update(productionOrders)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(eq(productionOrders.id, orderId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
