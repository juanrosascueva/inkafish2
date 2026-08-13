import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  purchases,
  purchaseItems,
  suppliers,
  sites,
  users,
  products,
  units,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: purchases.id,
      purchaseNumber: purchases.purchaseNumber,
      status: purchases.status,
      expectedDate: purchases.expectedDate,
      documentNumber: purchases.documentNumber,
      totalAmount: purchases.totalAmount,
      currency: purchases.currency,
      notes: purchases.notes,
      createdAt: purchases.createdAt,
      supplier: { id: suppliers.id, name: suppliers.name },
      site: { id: sites.id, name: sites.name },
      requestedByUser: { id: users.id, name: users.name },
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(sites, eq(purchases.siteId, sites.id))
    .leftJoin(users, eq(purchases.requestedBy, users.id))
    .orderBy(desc(purchases.createdAt))
    .limit(100);

  return NextResponse.json({ purchases: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      supplierId,
      siteId,
      warehouseId,
      expectedDate,
      documentNumber,
      notes,
      currency,
      items,
    } = body;

    if (!supplierId || !siteId || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice?: number }) =>
        sum + (item.quantity * (item.unitPrice ?? 0)),
      0
    );

    const [purchase] = await db
      .insert(purchases)
      .values({
        purchaseNumber: `OC-${Date.now()}`,
        supplierId: parseInt(supplierId),
        siteId: parseInt(siteId),
        warehouseId: warehouseId ? parseInt(warehouseId) : null,
        requestedBy: session.id,
        expectedDate,
        documentNumber,
        notes,
        currency: currency ?? "PEN",
        totalAmount: String(totalAmount),
        status: "DRAFT",
      })
      .returning();

    await db
      .update(purchases)
      .set({ purchaseNumber: generateCode("OC", purchase.id) })
      .where(eq(purchases.id, purchase.id));

    await db.insert(purchaseItems).values(
      items.map((item: { productId: number; unitId: number; quantity: number; unitPrice?: number; notes?: string }) => ({
        purchaseId: purchase.id,
        productId: item.productId,
        unitId: item.unitId,
        quantity: String(item.quantity),
        unitPrice: item.unitPrice ? String(item.unitPrice) : null,
        pendingQuantity: String(item.quantity),
        notes: item.notes,
      }))
    );

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    console.error("Purchase create error:", error);
    return NextResponse.json({ error: "Error al crear orden de compra" }, { status: 500 });
  }
}
