import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";
import { validatePayload, wasteRecordSchema } from "@/lib/validations";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawWaste: any[] = await convexClient.query(api.waste.list, {});
    const [products, units, sites] = await Promise.all([
      convexClient.query(api.products.list, {}),
      convexClient.query(api.master.getUnits, {}),
      convexClient.query(api.master.getSites, {}),
    ]);

    const prodMap = new Map((products as any[]).map((p) => [p._id, p]));
    const unitMap = new Map((units as any[]).map((u) => [u._id, u]));
    const siteMap = new Map((sites as any[]).map((s) => [s._id, s]));

    const waste = rawWaste.map((w) => {
      const prod = prodMap.get(w.productId);
      const unit = unitMap.get(w.unitId);
      const site = siteMap.get(w.siteId);
      return {
        id: w._id,
        quantity: w.quantity,
        stage: w.stage,
        cause: w.cause,
        sourceContext: w.sourceContext || "STORAGE",
        createdAt: w.createdAt,
        notes: w.notes,
        product: prod ? { id: prod._id, name: prod.name, code: prod.code } : null,
        unit: unit ? { id: unit._id, symbol: unit.symbol } : null,
        site: site ? { id: site._id, name: site.name } : null,
      };
    });

    return NextResponse.json({ waste });
  } catch (error) {
    console.error("Error fetching waste records:", error);
    return NextResponse.json({ waste: [] });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ["ADMIN", "CHEF", "WAREHOUSE"]);
  if ("response" in authResult) return authResult.response;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const validation = validatePayload(wasteRecordSchema, body);
    if (!validation.success) return validation.response;

    const validatedData = validation.data;

    const wasteId = await convexClient.mutation(api.waste.recordWaste, {
      productId: validatedData.productId as any,
      unitId: validatedData.unitId as any,
      quantity: validatedData.quantity,
      stage: validatedData.stage,
      cause: validatedData.cause,
      sourceContext: body.sourceContext || (validatedData.stage === "PRODUCTION" ? "PRODUCTION_DISCARD" : "STORAGE"),
      siteId: validatedData.siteId as any,
      areaId: validatedData.areaId ? (validatedData.areaId as any) : undefined,
      warehouseId: validatedData.warehouseId ? (validatedData.warehouseId as any) : undefined,
      recordedBy: session.id as any,
      notes: validatedData.notes,
    });

    return NextResponse.json({ ok: true, wasteId }, { status: 201 });
  } catch (error: any) {
    console.error("Waste record error:", error);
    return NextResponse.json({ error: error.message || "Error al registrar merma" }, { status: 500 });
  }
}
