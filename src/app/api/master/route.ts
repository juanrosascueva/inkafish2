import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  sites,
  areas,
  warehouses,
  locations,
  units,
  categories,
  subcategories,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "sites") {
    const result = await db.select().from(sites).where(eq(sites.active, true));
    return NextResponse.json({ sites: result });
  }

  if (type === "areas") {
    const siteId = searchParams.get("siteId");
    let query = db.select({
      id: areas.id,
      name: areas.name,
      code: areas.code,
      siteId: areas.siteId,
      active: areas.active,
    }).from(areas).$dynamic();
    if (siteId) query = query.where(eq(areas.siteId, parseInt(siteId)));
    const result = await query;
    return NextResponse.json({ areas: result });
  }

  if (type === "warehouses") {
    const siteId = searchParams.get("siteId");
    let query = db.select({
      id: warehouses.id,
      name: warehouses.name,
      code: warehouses.code,
      siteId: warehouses.siteId,
      active: warehouses.active,
    }).from(warehouses).$dynamic();
    if (siteId) query = query.where(eq(warehouses.siteId, parseInt(siteId)));
    const result = await query;
    return NextResponse.json({ warehouses: result });
  }

  if (type === "units") {
    const result = await db.select().from(units).where(eq(units.active, true));
    return NextResponse.json({ units: result });
  }

  if (type === "categories") {
    const result = await db.select().from(categories).where(eq(categories.active, true));
    return NextResponse.json({ categories: result });
  }

  if (type === "users") {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      siteId: users.siteId,
      areaId: users.areaId,
      active: users.active,
    }).from(users);
    return NextResponse.json({ users: result });
  }

  // Return all master data
  const [allSites, allAreas, allWarehouses, allUnits, allCategories] = await Promise.all([
    db.select().from(sites),
    db.select().from(areas),
    db.select().from(warehouses),
    db.select().from(units),
    db.select().from(categories),
  ]);

  return NextResponse.json({
    sites: allSites,
    areas: allAreas,
    warehouses: allWarehouses,
    units: allUnits,
    categories: allCategories,
  });
}
