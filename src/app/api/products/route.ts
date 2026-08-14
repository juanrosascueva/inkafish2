import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawProducts: any[] = await convexClient.query(api.products.list, {});
    const categories: any[] = await convexClient.query(api.master.getCategories, {});
    const units: any[] = await convexClient.query(api.master.getUnits, {});

    const catMap = new Map(categories.map((c) => [c._id, c]));
    const unitMap = new Map(units.map((u) => [u._id, u]));

    const products = rawProducts.map((p) => ({
      id: p._id,
      code: p.code,
      name: p.name,
      presentation: p.presentation,
      brand: p.brand,
      tracksLot: p.tracksLot,
      tracksExpiry: p.tracksExpiry,
      allowsSubstitution: p.allowsSubstitution,
      minStock: p.minStock,
      active: p.active,
      notes: p.notes,
      category: catMap.get(p.categoryId) ? { id: p.categoryId, name: catMap.get(p.categoryId).name } : null,
      unit: unitMap.get(p.unitId) ? { id: p.unitId, name: unitMap.get(p.unitId).name, symbol: unitMap.get(p.unitId).symbol, allowsDecimals: unitMap.get(p.unitId).allowsDecimals } : null,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products from Convex:", error);
    return NextResponse.json({ products: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const productId = await convexClient.mutation(api.products.create, body);
    return NextResponse.json({ ok: true, id: productId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
