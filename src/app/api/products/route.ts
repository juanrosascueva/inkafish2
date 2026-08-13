import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageMaster } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ products: [] });
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
