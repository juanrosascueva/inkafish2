import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawPurchases: any[] = await convexClient.query(api.purchases.list, {});
    const suppliers: any[] = await convexClient.query(api.suppliers.list, {});
    const warehouses: any[] = await convexClient.query(api.master.getWarehouses, {});

    const suppMap = new Map(suppliers.map((s) => [s._id, s]));
    const whMap = new Map(warehouses.map((w) => [w._id, w]));

    const purchases = rawPurchases.map((p) => ({
      id: p._id,
      purchaseNumber: p.purchaseNumber,
      status: p.status,
      expectedDate: p.expectedDate,
      documentNumber: p.documentNumber,
      totalAmount: p.totalAmount,
      currency: p.currency,
      supplier: suppMap.get(p.supplierId) ? { id: p.supplierId, name: suppMap.get(p.supplierId).name } : null,
      warehouse: p.warehouseId && whMap.get(p.warehouseId) ? { id: p.warehouseId, name: whMap.get(p.warehouseId).name } : null,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Error fetching purchases from Convex:", error);
    return NextResponse.json({ purchases: [] });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ["ADMIN", "WAREHOUSE", "APPROVER"]);
  if ("response" in authResult) return authResult.response;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = await convexClient.mutation(api.purchases.create, {
      ...body,
      requestedBy: session.id as any,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: error.message || "Error al registrar compra" }, { status: 500 });
  }
}
