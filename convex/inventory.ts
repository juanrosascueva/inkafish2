import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMovements = query({
  args: {
    siteId: v.optional(v.id("sites")),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx: any, args: any) => {
    if (args.productId) {
      return await ctx.db
        .query("inventoryMovements")
        .withIndex("by_product", (q: any) => q.eq("productId", args.productId!))
        .order("desc")
        .collect();
    }
    if (args.siteId) {
      return await ctx.db
        .query("inventoryMovements")
        .withIndex("by_site", (q: any) => q.eq("siteId", args.siteId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("inventoryMovements").order("desc").collect();
  },
});

export const getBalances = query({
  args: { siteId: v.optional(v.id("sites")) },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.query("inventoryBalances").collect();
  },
});

// FEFO: Consulta de lotes ordenados por fecha de vencimiento (First Expired, First Out)
export const getLotsByFEFO = query({
  args: {
    productId: v.optional(v.id("products")),
    siteId: v.optional(v.id("sites")),
    warehouseId: v.optional(v.id("warehouses")),
  },
  handler: async (ctx: any, args: any) => {
    let allLots: any[] = [];
    if (args.productId) {
      allLots = await ctx.db
        .query("lots")
        .withIndex("by_product", (q: any) => q.eq("productId", args.productId!))
        .collect();
    } else {
      allLots = await ctx.db.query("lots").collect();
    }

    // Filtrar lotes activos con saldo disponible
    const activeLots = allLots.filter((lot: any) => {
      if (!lot.active || lot.remainingQuantity <= 0) return false;
      if (args.siteId && lot.siteId && lot.siteId !== args.siteId) return false;
      if (args.warehouseId && lot.warehouseId && lot.warehouseId !== args.warehouseId) return false;
      return true;
    });

    // Ordenar por FEFO: Menor expiresAt primero. Si no tiene expira, va al final.
    return activeLots.sort((a: any, b: any) => {
      if (a.expiresAt && b.expiresAt) return a.expiresAt - b.expiresAt;
      if (a.expiresAt) return -1;
      if (b.expiresAt) return 1;
      return a.createdAt - b.createdAt;
    });
  },
});

export const recordMovement = mutation({
  args: {
    movementType: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
    unitId: v.id("units"),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    locationId: v.optional(v.id("locations")),
    lotId: v.optional(v.id("lots")),
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const movementId = await ctx.db.insert("inventoryMovements", {
      ...args,
      createdAt: now,
    });

    const existingBalance = await ctx.db
      .query("inventoryBalances")
      .withIndex("by_product_site", (q: any) =>
        q.eq("productId", args.productId).eq("siteId", args.siteId)
      )
      .first();

    const isPositive = [
      "PURCHASE_RECEIPT",
      "WAREHOUSE_ENTRY",
      "INTERNAL_RECEIPT",
      "TRANSFER_IN",
      "PRODUCTION_OUTPUT",
      "RETURN",
      "ADJUSTMENT_POSITIVE",
    ].includes(args.movementType);

    const delta = isPositive ? args.quantity : -args.quantity;

    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, {
        quantity: Math.max(0, existingBalance.quantity + delta),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("inventoryBalances", {
        productId: args.productId,
        siteId: args.siteId,
        warehouseId: args.warehouseId,
        locationId: args.locationId,
        lotId: args.lotId,
        quantity: Math.max(0, delta),
        updatedAt: now,
      });
    }

    return movementId;
  },
});

// Mutación Atómica de Consumo por FEFO (First Expired, First Out)
export const consumeStockFEFO = mutation({
  args: {
    productId: v.id("products"),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    quantityToConsume: v.number(),
    unitId: v.id("units"),
    movementType: v.string(),
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { productId, siteId, warehouseId, quantityToConsume, unitId, movementType, createdBy, reason } = args;

    if (quantityToConsume <= 0) {
      throw new Error("La cantidad a consumir debe ser mayor a 0");
    }

    // 1. Obtener lotes del producto
    const allLots = await ctx.db
      .query("lots")
      .withIndex("by_product", (q: any) => q.eq("productId", productId))
      .collect();

    // 2. Filtrar por activos y con stock
    const activeLots = allLots.filter((lot: any) => {
      if (!lot.active || lot.remainingQuantity <= 0) return false;
      if (siteId && lot.siteId && lot.siteId !== siteId) return false;
      if (warehouseId && lot.warehouseId && lot.warehouseId !== warehouseId) return false;
      return true;
    });

    // 3. Ordenar por FEFO (Menor expiresAt primero)
    activeLots.sort((a: any, b: any) => {
      if (a.expiresAt && b.expiresAt) return a.expiresAt - b.expiresAt;
      if (a.expiresAt) return -1;
      if (b.expiresAt) return 1;
      return a.createdAt - b.createdAt;
    });

    // 4. Validar disponibilidad suficiente
    const totalAvailable = activeLots.reduce((sum: number, l: any) => sum + l.remainingQuantity, 0);
    if (totalAvailable < quantityToConsume) {
      throw new Error(`Stock insuficiente en lotes FEFO. Disponible: ${totalAvailable}, Requerido: ${quantityToConsume}`);
    }

    // 5. Descontar secuencialmente de forma ATÓMICA
    let remaining = quantityToConsume;
    const now = Date.now();

    for (const lot of activeLots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.remainingQuantity, remaining);
      remaining -= take;

      const newRemaining = lot.remainingQuantity - take;
      await ctx.db.patch(lot._id, {
        remainingQuantity: newRemaining,
        active: newRemaining > 0,
      });

      // Insertar movimiento atómico asociando el lote específico
      await ctx.db.insert("inventoryMovements", {
        movementType,
        productId,
        quantity: take,
        unitId,
        siteId,
        warehouseId: warehouseId || lot.warehouseId,
        lotId: lot._id,
        createdBy,
        reason: reason ? `${reason} (Lote: ${lot.lotNumber})` : `Consumo FEFO Lote ${lot.lotNumber}`,
        createdAt: now,
      });
    }

    // 6. Actualizar saldo acumulado en inventoryBalances
    const existingBalance = await ctx.db
      .query("inventoryBalances")
      .withIndex("by_product_site", (q: any) =>
        q.eq("productId", productId).eq("siteId", siteId)
      )
      .first();

    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, {
        quantity: Math.max(0, existingBalance.quantity - quantityToConsume),
        updatedAt: now,
      });
    }

    return { ok: true, consumed: quantityToConsume };
  },
});
