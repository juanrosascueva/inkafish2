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
    stage: v.string(),
    cause: v.string(),
    areaId: v.optional(v.id("areas")),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    recordedBy: v.id("users"),
    costEstimate: v.optional(v.number()),
    actionTaken: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("wasteRecords", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
