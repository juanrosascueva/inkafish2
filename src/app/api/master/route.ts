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
