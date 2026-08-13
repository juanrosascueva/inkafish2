import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  transfers,
  transferItems,
  sites,
  warehouses,
  products,
  units,
  users,
  inventoryMovements,
  inventoryBalances,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: transfers.id,
      transferNumber: transfers.transferNumber,
      status: transfers.status,
      plannedDate: transfers.plannedDate,
      dispatchedAt: transfers.dispatchedAt,
      receivedAt: transfers.receivedAt,
      notes: transfers.notes,
      createdAt: transfers.createdAt,
      originSite: { id: sites.id, name: sites.name },
      destinationSite: { id: sites.id, name: sites.name },
    })
    .from(transfers)
    .leftJoin(sites, eq(transfers.originSiteId, sites.id))
    .orderBy(desc(transfers.createdAt))
    .limit(100);

  return NextResponse.json({ transfers: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      originSiteId,
      destinationSiteId,
      originWarehouseId,
      destinationWarehouseId,
      plannedDate,
      notes,
      items,
    } = body;

    if (!originSiteId || !destinationSiteId || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const [transfer] = await db
      .insert(transfers)
      .values({
        transferNumber: `TRF-${Date.now()}`,
        originSiteId: parseInt(originSiteId),
        destinationSiteId: parseInt(destinationSiteId),
        originWarehouseId: originWarehouseId ? parseInt(originWarehouseId) : null,
        destinationWarehouseId: destinationWarehouseId ? parseInt(destinationWarehouseId) : null,
        requestedBy: session.id,
        plannedDate,
        notes,
        status: "DRAFT",
      })
      .returning();

    await db
      .update(transfers)
      .set({ transferNumber: generateCode("TRF", transfer.id) })
      .where(eq(transfers.id, transfer.id));

    await db.insert(transferItems).values(
      items.map((item: { productId: number; unitId: number; requestedQuantity: number; notes?: string }) => ({
        transferId: transfer.id,
        productId: item.productId,
        unitId: item.unitId,
        requestedQuantity: String(item.requestedQuantity),
        notes: item.notes,
      }))
    );

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error("Transfer create error:", error);
    return NextResponse.json({ error: "Error al crear transferencia" }, { status: 500 });
  }
}
