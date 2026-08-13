import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { siteId: v.optional(v.id("sites")) },
  handler: async (ctx: any, args: any) => {
    if (args.siteId) {
      return await ctx.db
        .query("wasteRecords")
        .withIndex("by_site", (q: any) => q.eq("siteId", args.siteId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("wasteRecords").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    unitId: v.id("units"),
    quantity: v.number(),
    stage: v.string(), // "STORAGE", "WAREHOUSE", "PRODUCTION", "PREPARATION", "SERVICE"
    cause: v.string(),
    areaId: v.optional(v.id("areas")),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    recordedBy: v.id("users"),
    costEstimate: v.optional(v.number()),
    actionTaken: v.optional(v.string()),
    notes: v.optional(v.string()),
    deductFromInventory: v.optional(v.boolean()), // Forzar descuento si se especifica
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const wasteId = await ctx.db.insert("wasteRecords", {
      productId: args.productId,
      unitId: args.unitId,
      quantity: args.quantity,
      stage: args.stage,
      cause: args.cause,
      areaId: args.areaId,
      siteId: args.siteId,
      warehouseId: args.warehouseId,
      recordedBy: args.recordedBy,
      costEstimate: args.costEstimate,
      actionTaken: args.actionTaken,
      notes: args.notes,
      createdAt: now,
    });

    // REGLA PRD (Sección 37 - Doble descuento):
    // Si la merma ocurre en Almacén/Almacenamiento (STORAGE/WAREHOUSE), el insumo no ha salido de almacén,
    // por lo que DEBE descontarse de inventoryBalances.
    // Si la merma ocurre en Producción/Cocina/Servicio, el insumo ya fue previamente descontado
    // de almacén (PRODUCTION_CONSUMPTION / INTERNAL_DISPATCH), por lo que se registra como MERMA ANALÍTICA
    // y NO se vuelve a restar de inventoryBalances (evitando doble descuento).
    const isWarehouseStage = ["STORAGE", "WAREHOUSE", "ALMACEN"].includes(args.stage.toUpperCase());
    const shouldDeduct = args.deductFromInventory !== undefined ? args.deductFromInventory : isWarehouseStage;

    if (shouldDeduct) {
      // Registrar movimiento de salida por merma en almacén
      await ctx.db.insert("inventoryMovements", {
        movementType: "WASTE",
        productId: args.productId,
        quantity: args.quantity,
        unitId: args.unitId,
        siteId: args.siteId,
        warehouseId: args.warehouseId,
        createdBy: args.recordedBy,
        reason: `Merma en etapa ${args.stage}: ${args.cause}`,
        createdAt: now,
      });

      // Descontar del balance de almacén
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

