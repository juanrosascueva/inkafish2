import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";
import { validatePayload, transferOrderSchema } from "@/lib/validations";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawTransfers: any[] = await convexClient.query(api.transfers.list, {});
    const transfers = rawTransfers.map((t) => ({
      id: t._id,
      transferNumber: t.transferNumber,
      status: t.status,
      plannedDate: t.plannedDate,
      createdAt: t.createdAt,
      notes: t.notes,
      discrepancyNote: t.discrepancyNote,
      originSite: t.originSite ? { id: t.originSite._id, name: t.originSite.name } : { name: "San Miguel" },
      destinationSite: t.destinationSite ? { id: t.destinationSite._id, name: t.destinationSite.name } : { name: "Lince" },
      requestedBy: t.requestedBy ? { id: t.requestedBy._id, name: t.requestedBy.name } : null,
      items: t.items || [],
    }));

    return NextResponse.json({ transfers });
  } catch (error: any) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json({ transfers: [] });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ["ADMIN", "WAREHOUSE", "CHEF"]);
  if ("response" in authResult) return authResult.response;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const validation = validatePayload(transferOrderSchema, body);
    if (!validation.success) return validation.response;

    const validatedData = validation.data;

    const transferId = await convexClient.mutation(api.transfers.createTransfer, {
      originSiteId: validatedData.originSiteId as any,
      destinationSiteId: validatedData.destinationSiteId as any,
      originWarehouseId: validatedData.originWarehouseId ? (validatedData.originWarehouseId as any) : undefined,
      destinationWarehouseId: validatedData.destinationWarehouseId ? (validatedData.destinationWarehouseId as any) : undefined,
      requestedBy: session.id as any,
      plannedDate: validatedData.plannedDate,
      notes: validatedData.notes,
      items: validatedData.items.map((i) => ({
        productId: i.productId as any,
        unitId: i.unitId as any,
        requestedQuantity: i.requestedQuantity,
      })),
    });

    return NextResponse.json({ ok: true, id: transferId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transfer:", error);
    return NextResponse.json({ error: error.message || "Error al registrar transferencia" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req, ["ADMIN", "WAREHOUSE"]);
  if ("response" in authResult) return authResult.response;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, transferId, receivedItems, discrepancyNote } = body;

    if (!transferId || !action) {
      return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 });
    }

    if (action === "ship") {
      const res = await convexClient.mutation(api.transfers.shipTransfer, {
        transferId: transferId as any,
        shippedBy: session.id as any,
      });
      return NextResponse.json(res);
    }

    if (action === "receive") {
      if (!receivedItems || !Array.isArray(receivedItems)) {
        return NextResponse.json({ error: "Ítems recepcionados son requeridos" }, { status: 400 });
      }

      const res = await convexClient.mutation(api.transfers.receiveTransfer, {
        transferId: transferId as any,
        receivedBy: session.id as any,
        receivedItems: receivedItems.map((r: any) => ({
          itemId: r.itemId as any,
          receivedQuantity: parseFloat(r.receivedQuantity) || 0,
        })),
        discrepancyNote,
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating transfer status:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar transferencia" }, { status: 500 });
  }
}
