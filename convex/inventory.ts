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
