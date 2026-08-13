import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("productionOrders").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    siteId: v.id("sites"),
    productionAreaId: v.optional(v.id("areas")),
    plannedDate: v.string(),
    shift: v.optional(v.string()),
    createdBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const count = (await ctx.db.query("productionOrders").collect()).length + 1;
    const productionOrderNumber = `OP-${String(count).padStart(6, "0")}`;

    return await ctx.db.insert("productionOrders", {
      productionOrderNumber,
      siteId: args.siteId,
      productionAreaId: args.productionAreaId,
      plannedDate: args.plannedDate,
      shift: args.shift,
      status: "DRAFT",
      createdBy: args.createdBy,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});
