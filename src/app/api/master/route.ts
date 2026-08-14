import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [sites, areas, warehouses, units, categories] = await Promise.all([
      convexClient.query(api.master.getSites, {}),
      convexClient.query(api.master.getAreas, {}),
      convexClient.query(api.master.getWarehouses, {}),
      convexClient.query(api.master.getUnits, {}),
      convexClient.query(api.master.getCategories, {}),
    ]);

    const formattedSites = sites.map((s: any) => ({ id: s._id, name: s.name, code: s.code, active: s.active }));
    const formattedAreas = areas.map((a: any) => ({ id: a._id, siteId: a.siteId, name: a.name, code: a.code, active: a.active }));
    const formattedWarehouses = warehouses.map((w: any) => ({ id: w._id, siteId: w.siteId, name: w.name, code: w.code, active: w.active }));
    const formattedUnits = units.map((u: any) => ({ id: u._id, name: u.name, symbol: u.symbol, allowsDecimals: u.allowsDecimals, active: u.active }));
    const formattedCategories = categories.map((c: any) => ({ id: c._id, name: c.name, code: c.code, active: c.active }));

    return NextResponse.json({
      sites: formattedSites,
      areas: formattedAreas,
      warehouses: formattedWarehouses,
      locations: [],
      categories: formattedCategories,
      subcategories: [],
      units: formattedUnits,
    });
  } catch (error) {
    console.error("Error fetching master data from Convex:", error);
    return NextResponse.json({ sites: [], areas: [], warehouses: [], locations: [], categories: [], subcategories: [], units: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const body = await req.json();

    if (type === "category") {
      const id = await convexClient.mutation(api.master.createCategory, body);
      return NextResponse.json({ ok: true, id }, { status: 201 });
    } else if (type === "unit") {
      const id = await convexClient.mutation(api.master.createUnit, body);
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al crear elemento maestro" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const body = await req.json();

    if (type === "category") {
      await convexClient.mutation(api.master.updateCategory, { id: body.id, name: body.name, code: body.code });
      return NextResponse.json({ ok: true });
    } else if (type === "unit") {
      await convexClient.mutation(api.master.updateUnit, { id: body.id, name: body.name, symbol: body.symbol, allowsDecimals: body.allowsDecimals });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar elemento maestro" }, { status: 500 });
  }
}
