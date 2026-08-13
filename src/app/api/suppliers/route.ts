import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { suppliers, supplierPrices, products, units } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { canManageMaster } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(suppliers)
    .orderBy(suppliers.name)
    .limit(200);

  return NextResponse.json({ suppliers: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageMaster(session.role)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, documentNumber, contactName, phone, email, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const [supplier] = await db
      .insert(suppliers)
      .values({ name, documentNumber, contactName, phone, email, notes })
      .returning();

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 });
  }
}
