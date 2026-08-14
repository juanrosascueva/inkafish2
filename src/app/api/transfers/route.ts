import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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
      plannedDate: t.requiredDate,
      dispatchedAt: t.createdAt,
      receivedAt: null,
      notes: t.notes,
      createdAt: t.createdAt,
      originSite: t.originSite ? { id: t.originSite._id, name: t.originSite.name } : { name: "San Miguel" },
      destinationSite: t.destinationSite ? { id: "lince", name: t.destinationSite.name } : { name: "Lince" },
    }));

    return NextResponse.json({ transfers });
  } catch (error: any) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json({ transfers: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { originSiteId, destinationSiteId, items, notes } = body;

    const [sites, units] = await Promise.all([
      convexClient.query(api.master.getSites, {}),
      convexClient.query(api.master.getUnits, {}),
    ]);

    const defaultSiteId = (sites as any[])[0]?._id;
    const defaultUnitId = (units as any[])[0]?._id;

    const requestId = await convexClient.mutation(api.requests.create, {
      siteId: (originSiteId || defaultSiteId) as any,
      areaId: undefined as any,
      requestedBy: session.id as any,
      requiredDate: new Date().toISOString().split("T")[0],
      priority: "NORMAL",
      type: "TRANSFER",
      outOfSchedule: false,
      notes: notes || `Transferencia a ${destinationSiteId || "Sede Destino"}`,
      items: (items || []).map((item: any) => ({
        productId: item.productId as any,
        requestedQuantity: parseFloat(item.quantity) || 1,
        unitId: (item.unitId || defaultUnitId) as any,
      })),
    });

    return NextResponse.json({ ok: true, id: requestId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transfer:", error);
    return NextResponse.json({ error: error.message || "Error al registrar transferencia" }, { status: 500 });
  }
}
