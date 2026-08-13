import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  requests,
  requestItems,
  requestApprovals,
  products,
  units,
  users,
  areas,
  sites,
  inventoryMovements,
  inventoryBalances,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { canApproveRequests } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const requestId = parseInt(id);

  const [request] = await db
    .select({
      id: requests.id,
      requestNumber: requests.requestNumber,
      status: requests.status,
      priority: requests.priority,
      type: requests.type,
      outOfSchedule: requests.outOfSchedule,
      requiredDate: requests.requiredDate,
      notes: requests.notes,
      urgentReason: requests.urgentReason,
      shift: requests.shift,
      closedReason: requests.closedReason,
      closedAt: requests.closedAt,
      createdAt: requests.createdAt,
      updatedAt: requests.updatedAt,
      site: { id: sites.id, name: sites.name },
      area: { id: areas.id, name: areas.name },
      requestedByUser: { id: users.id, name: users.name },
    })
    .from(requests)
    .leftJoin(sites, eq(requests.siteId, sites.id))
    .leftJoin(areas, eq(requests.areaId, areas.id))
    .leftJoin(users, eq(requests.requestedBy, users.id))
    .where(eq(requests.id, requestId));

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db
    .select({
      id: requestItems.id,
      requestedQuantity: requestItems.requestedQuantity,
      approvedQuantity: requestItems.approvedQuantity,
      fulfilledQuantity: requestItems.fulfilledQuantity,
      pendingQuantity: requestItems.pendingQuantity,
      itemStatus: requestItems.itemStatus,
      approvalComment: requestItems.approvalComment,
      productNameTemp: requestItems.productNameTemp,
      notes: requestItems.notes,
      product: { id: products.id, name: products.name, code: products.code },
      unit: { id: units.id, name: units.name, symbol: units.symbol },
    })
    .from(requestItems)
    .leftJoin(products, eq(requestItems.productId, products.id))
    .leftJoin(units, eq(requestItems.unitId, units.id))
    .where(eq(requestItems.requestId, requestId));

  const approvals = await db
    .select({
      id: requestApprovals.id,
      action: requestApprovals.action,
      originalQuantity: requestApprovals.originalQuantity,
      approvedQuantity: requestApprovals.approvedQuantity,
      reason: requestApprovals.reason,
      createdAt: requestApprovals.createdAt,
      approvedByUser: { id: users.id, name: users.name },
    })
    .from(requestApprovals)
    .leftJoin(users, eq(requestApprovals.approvedBy, users.id))
    .where(eq(requestApprovals.requestId, requestId));

  return NextResponse.json({ request, items, approvals });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const requestId = parseInt(id);
  const body = await req.json();
  const { action, items, reason, closedReason } = body;

  const [existingRequest] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));

  if (!existingRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "submit") {
    await db
      .update(requests)
      .set({ status: "PENDING_APPROVAL", updatedAt: new Date() })
      .where(eq(requests.id, requestId));
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    if (!canApproveRequests(session.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Process each item approval
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const updateData: Partial<typeof requestItems.$inferInsert> = {
          itemStatus: item.approved ? "PREPARED" : "NOT_AVAILABLE",
        };
        if (item.approvedQuantity !== undefined) {
          updateData.approvedQuantity = String(item.approvedQuantity);
        }
        if (item.comment) {
          updateData.approvalComment = item.comment;
        }

        await db
          .update(requestItems)
          .set(updateData)
          .where(and(eq(requestItems.id, item.id), eq(requestItems.requestId, requestId)));

        await db.insert(requestApprovals).values({
          requestId,
          requestItemId: item.id,
          approvedBy: session.id,
          action: item.approved ? "APPROVE" : "REJECT",
          originalQuantity: item.originalQuantity ? String(item.originalQuantity) : null,
          approvedQuantity: item.approvedQuantity ? String(item.approvedQuantity) : null,
          reason: item.reason,
        });
      }

      // Determine new status
      const allItems = await db
        .select()
        .from(requestItems)
        .where(eq(requestItems.requestId, requestId));

      const approved = allItems.filter((i: any) => i.itemStatus !== "NOT_AVAILABLE");
      const rejected = allItems.filter((i: any) => i.itemStatus === "NOT_AVAILABLE");

      let newStatus: typeof existingRequest.status = "APPROVED";
      if (approved.length === 0) newStatus = "REJECTED";
      else if (rejected.length > 0) newStatus = "PARTIALLY_APPROVED";

      await db
        .update(requests)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(requests.id, requestId));
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    if (!canApproveRequests(session.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    await db
      .update(requests)
      .set({ status: "REJECTED", updatedAt: new Date() })
      .where(eq(requests.id, requestId));
    await db.insert(requestApprovals).values({
      requestId,
      approvedBy: session.id,
      action: "REJECT",
      reason,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "close_incomplete") {
    await db
      .update(requests)
      .set({
        status: "CLOSED_INCOMPLETE",
        closedBy: session.id,
        closedReason,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));
    return NextResponse.json({ ok: true });
  }

  if (action === "dispatch") {
    if (!["ALMACEN", "ADMINISTRACION", "GERENCIA"].includes(session.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Get approved items
    const approvedItems = await db
      .select()
      .from(requestItems)
      .where(and(eq(requestItems.requestId, requestId)));

    // Create inventory movements for dispatched items
    for (const item of approvedItems) {
      if (!item.productId || !item.approvedQuantity) continue;
      const qty = parseFloat(item.approvedQuantity ?? "0");
      if (qty <= 0) continue;

      // Create movement
      await db.insert(inventoryMovements).values({
        movementType: "INTERNAL_DISPATCH",
        productId: item.productId,
        quantity: String(-Math.abs(qty)),
        unitId: item.unitId,
        siteId: existingRequest.siteId,
        referenceType: "request",
        referenceId: requestId,
        createdBy: session.id,
      });

      // Update or create balance
      const [balance] = await db
        .select()
        .from(inventoryBalances)
        .where(
          and(
            eq(inventoryBalances.productId, item.productId),
            eq(inventoryBalances.siteId, existingRequest.siteId)
          )
        )
        .limit(1);

      if (balance) {
        await db
          .update(inventoryBalances)
          .set({
            quantity: String(parseFloat(balance.quantity ?? "0") - qty),
            updatedAt: new Date(),
          })
          .where(eq(inventoryBalances.id, balance.id));
      }

      await db
        .update(requestItems)
        .set({
          fulfilledQuantity: item.approvedQuantity,
          itemStatus: "PREPARED",
        })
        .where(eq(requestItems.id, item.id));
    }

    await db
      .update(requests)
      .set({ status: "DISPATCHED", updatedAt: new Date() })
      .where(eq(requests.id, requestId));

    return NextResponse.json({ ok: true });
  }

  if (action === "receive") {
    await db
      .update(requests)
      .set({ status: "RECEIVED", updatedAt: new Date() })
      .where(eq(requests.id, requestId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
