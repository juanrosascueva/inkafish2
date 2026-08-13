import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { products, categories, subcategories, units } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { canManageMaster } from "@/lib/utils";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");
  const active = searchParams.get("active");

  let query = db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      presentation: products.presentation,
      brand: products.brand,
      tracksLot: products.tracksLot,
      tracksExpiry: products.tracksExpiry,
      allowsSubstitution: products.allowsSubstitution,
      minStock: products.minStock,
      active: products.active,
      notes: products.notes,
      category: { id: categories.id, name: categories.name },
      unit: { id: units.id, name: units.name, symbol: units.symbol, allowsDecimals: units.allowsDecimals },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(units, eq(products.unitId, units.id))
    .$dynamic();

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.code, `%${search}%`)
      )
    );
  }
  if (categoryId) conditions.push(eq(products.categoryId, parseInt(categoryId)));
  if (active !== null && active !== undefined) {
    conditions.push(eq(products.active, active === "true"));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.limit(200);
  return NextResponse.json({ products: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageMaster(session.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      categoryId,
      subcategoryId,
      unitId,
      presentation,
      brand,
      tracksLot,
      tracksExpiry,
      allowsSubstitution,
      minStock,
      notes,
    } = body;

    if (!name || !categoryId || !unitId) {
      return NextResponse.json({ error: "Datos requeridos incompletos" }, { status: 400 });
    }

    const [product] = await db
      .insert(products)
      .values({
        code: `P-${Date.now()}`,
        name,
        categoryId: parseInt(categoryId),
        subcategoryId: subcategoryId ? parseInt(subcategoryId) : null,
        unitId: parseInt(unitId),
        presentation,
        brand,
        tracksLot: tracksLot ?? false,
        tracksExpiry: tracksExpiry ?? false,
        allowsSubstitution: allowsSubstitution ?? true,
        minStock: minStock ? String(minStock) : null,
        notes,
        active: true,
      })
      .returning();

    // Update code with proper format
    await db
      .update(products)
      .set({ code: generateCode("P", product.id) })
      .where(eq(products.id, product.id));

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
