import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawSuppliers: any[] = await convexClient.query(api.suppliers.list, {});
    const suppliers = rawSuppliers.map((s) => ({
      id: s._id,
      name: s.name,
      documentNumber: s.documentNumber,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      active: s.active,
      notes: s.notes,
    }));
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching suppliers from Convex:", error);
    return NextResponse.json({ suppliers: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = await convexClient.mutation(api.suppliers.create, body);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al registrar proveedor" }, { status: 500 });
  }
}
