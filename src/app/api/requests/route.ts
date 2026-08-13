import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { requests, requestItems, areas, sites, users } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const siteId = searchParams.get("siteId");

  let query = db
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
    .orderBy(desc(requests.createdAt))
    .$dynamic();

  const conditions = [];
  if (status) conditions.push(eq(requests.status, status as "DRAFT"));
  if (siteId) conditions.push(eq(requests.siteId, parseInt(siteId)));

  // Non-admin users can only see their own requests
  if (!["GERENCIA", "ADMINISTRACION", "ALMACEN", "CHEF_EJECUTIVA"].includes(session.role)) {
    conditions.push(eq(requests.requestedBy, session.id));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.limit(100);
  return NextResponse.json({ requests: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      areaId,
      siteId,
      requiredDate,
      shift,
      priority,
      type,
      urgentReason,
      notes,
      items,
    } = body;

    if (!areaId || !siteId || !requiredDate || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if ((priority === "URGENT" || type === "URGENT") && !urgentReason) {
      return NextResponse.json(
        { error: "Motivo urgente es obligatorio" },
        { status: 400 }
      );
    }

    const newRequest = await db
      .insert(requests)
      .values({
        requestNumber: `SOL-${Date.now()}`,
        siteId: parseInt(siteId),
        areaId: parseInt(areaId),
        requestedBy: session.id,
        requiredDate,
        shift,
        priority: priority ?? "NORMAL",
        type: type ?? "REGULAR",
        urgentReason,
        notes,
        outOfSchedule: false,
        status: "DRAFT",
      })
      .returning();

    const request = newRequest[0];

    // Update request number
    await db
      .update(requests)
      .set({ requestNumber: generateCode("SOL", request.id) })
      .where(eq(requests.id, request.id));

    // Insert items
    await db.insert(requestItems).values(
      items.map((item: { productId?: number; productNameTemp?: string; requestedQuantity: number; unitId: number; notes?: string }) => ({
        requestId: request.id,
        productId: item.productId ?? null,
        productNameTemp: item.productNameTemp ?? null,
        requestedQuantity: String(item.requestedQuantity),
        unitId: item.unitId,
        notes: item.notes,
        itemStatus: "PENDING",
      }))
    );

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 });
  }
}
