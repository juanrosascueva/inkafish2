import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const purchase: any = await convexClient.query(api.purchases.getById, {
      id: params.id as any,
    });

    if (!purchase) {
      return NextResponse.json({ error: "Orden de compra no encontrada" }, { status: 404 });
    }

    const [products, units] = await Promise.all([
      convexClient.query(api.products.list, {}),
      convexClient.query(api.master.getUnits, {}),
    ]);

    const prodMap = new Map((products as any[]).map((p) => [p._id, p]));
    const unitMap = new Map((units as any[]).map((u) => [u._id, u]));

    const formattedItems = (purchase.items || []).map((item: any) => ({
      id: item._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      receivedQuantity: item.receivedQuantity,
      notes: item.notes,
      product: prodMap.get(item.productId) ? { id: item.productId, code: prodMap.get(item.productId).code, name: prodMap.get(item.productId).name } : null,
      unit: unitMap.get(item.unitId) ? { id: item.unitId, name: unitMap.get(item.unitId).name, symbol: unitMap.get(item.unitId).symbol } : null,
    }));

    return NextResponse.json({
      purchase: {
        id: purchase._id,
        purchaseNumber: purchase.purchaseNumber,
        status: purchase.status,
        expectedDate: purchase.expectedDate,
        documentNumber: purchase.documentNumber,
        totalAmount: purchase.totalAmount,
        currency: purchase.currency,
        notes: purchase.notes,
        createdAt: purchase.createdAt,
        supplier: purchase.supplier ? { id: purchase.supplier._id, name: purchase.supplier.name, documentNumber: purchase.supplier.documentNumber } : null,
        site: purchase.site ? { id: purchase.site._id, name: purchase.site.name } : null,
        warehouse: purchase.warehouse ? { id: purchase.warehouse._id, name: purchase.warehouse.name } : null,
        requestedByUser: purchase.requestedByUser ? { id: purchase.requestedByUser._id, name: purchase.requestedByUser.name } : null,
        items: formattedItems,
      },
    });
  } catch (error: any) {
    console.error("Error fetching purchase detail:", error);
    return NextResponse.json({ error: "Error al obtener detalle de la compra" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const action = body.action;

    if (action === "APPROVE") {
      await convexClient.mutation(api.purchases.updateStatus, {
        id: params.id as any,
        status: "APPROVED",
        approvedBy: session.id as any,
      });
      return NextResponse.json({ ok: true, status: "APPROVED" });
    } else if (action === "CANCEL") {
      await convexClient.mutation(api.purchases.updateStatus, {
        id: params.id as any,
        status: "CANCELLED",
      });
      return NextResponse.json({ ok: true, status: "CANCELLED" });
    } else if (action === "RECEIVE") {
      await convexClient.mutation(api.purchases.receivePurchase, {
        id: params.id as any,
        receivedBy: session.id as any,
        documentNumber: body.documentNumber,
      });
      return NextResponse.json({ ok: true, status: "RECEIVED" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating purchase:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar la compra" }, { status: 500 });
  }
}
