import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx: any, args: any) => {
    let records: any[] = [];
    if (args.siteId) {
      records = await ctx.db
        .query("wasteRecords")
        .withIndex("by_site", (q: any) => q.eq("siteId", args.siteId))
        .order("desc")
        .collect();
    } else {
      records = await ctx.db.query("wasteRecords").order("desc").collect();
    }
    return records;
  },
});

export const recordWaste = mutation({
  args: {
    productId: v.id("products"),
    unitId: v.id("units"),
    quantity: v.number(),
    stage: v.string(),
    cause: v.string(),
    sourceContext: v.optional(v.string()), // "STORAGE" | "PRODUCTION_DISCARD" | "IN_TRANSIT_LOSS" | "EXPIRED"
    productionOrderId: v.optional(v.id("productionOrders")),
    transferId: v.optional(v.string()),
    siteId: v.id("sites"),
    areaId: v.optional(v.id("areas")),
    warehouseId: v.optional(v.id("warehouses")),
    recordedBy: v.id("users"),
    costEstimate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const wasteId = await ctx.db.insert("wasteRecords", {
      ...args,
      createdAt: now,
    });

    // ⚠️ REGLA ANTI-DOBLE DESCUENTO:
    // Si la merma proviene de una Orden de Producción (PRODUCTION_DISCARD), los insumos ya fueron
    // descontados al cerrarse la orden. Por lo tanto, SOLO guardamos el registro de merma para estadísticas
    // y NO aplicamos un segundo descuento de inventario.
    const isProductionDiscard = args.sourceContext === "PRODUCTION_DISCARD";

    if (!isProductionDiscard) {
      // Para mermas en Almacenamiento, Vencimiento o Pérdida en Tránsito, descontamos stock atómicamente por FEFO
      const allLots = await ctx.db
        .query("lots")
        .withIndex("by_product", (q: any) => q.eq("productId", args.productId))
        .collect();

      const activeLots = allLots.filter((lot: any) => {
        if (!lot.active || lot.remainingQuantity <= 0) return false;
        if (args.siteId && lot.siteId && lot.siteId !== args.siteId) return false;
        if (args.warehouseId && lot.warehouseId && lot.warehouseId !== args.warehouseId) return false;
        return true;
      });

      activeLots.sort((a: any, b: any) => {
        if (a.expiresAt && b.expiresAt) return a.expiresAt - b.expiresAt;
        if (a.expiresAt) return -1;
        if (b.expiresAt) return 1;
        return a.createdAt - b.createdAt;
      });

      let remaining = args.quantity;
      for (const lot of activeLots) {
        if (remaining <= 0) break;
        const take = Math.min(lot.remainingQuantity, remaining);
        remaining -= take;

        const newRemaining = lot.remainingQuantity - take;
        await ctx.db.patch(lot._id, {
          remainingQuantity: newRemaining,
          active: newRemaining > 0,
        });

        await ctx.db.insert("inventoryMovements", {
          movementType: "WASTE_ENTRY",
          productId: args.productId,
          quantity: take,
          unitId: args.unitId,
          siteId: args.siteId,
          warehouseId: args.warehouseId || lot.warehouseId,
          lotId: lot._id,
          createdBy: args.recordedBy,
          reason: `Merma (${args.stage}): ${args.cause}`,
          createdAt: now,
        });
      }

      // Actualizar balance acumulado
      const existingBalance = await ctx.db
        .query("inventoryBalances")
        .withIndex("by_product_site", (q: any) =>
          q.eq("productId", args.productId).eq("siteId", args.siteId)
        )
        .first();

      if (existingBalance) {
        await ctx.db.patch(existingBalance._id, {
          quantity: Math.max(0, existingBalance.quantity - args.quantity),
          updatedAt: now,
        });
      }
    }

    return wasteId;
  },
});
