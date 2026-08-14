import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawOrders: any[] = await convexClient.query(api.production.list, {});
    const productionOrders = rawOrders.map((o) => ({
      id: o._id,
      productionOrderNumber: o.productionOrderNumber,
      plannedDate: o.plannedDate,
      shift: o.shift,
      status: o.status,
      totalInputQuantity: o.totalInputQuantity,
      totalOutputQuantity: o.totalOutputQuantity,
      wasteQuantity: o.wasteQuantity,
      yieldPercentage: o.yieldPercentage,
      createdAt: o.createdAt,
    }));
    return NextResponse.json({ productionOrders });
  } catch (error) {
    console.error("Error fetching production orders from Convex:", error);
    return NextResponse.json({ productionOrders: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = await convexClient.mutation(api.production.create, {
      ...body,
      createdBy: session.id as any,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al registrar orden de producción" }, { status: 500 });
  }
}
