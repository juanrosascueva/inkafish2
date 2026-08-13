import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSites = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("sites").collect();
  },
});

export const getAreas = query({
  args: { siteId: v.optional(v.id("sites")) },
  handler: async (ctx: any, args: any) => {
    if (args.siteId) {
      return await ctx.db
        .query("areas")
        .withIndex("by_site", (q: any) => q.eq("siteId", args.siteId!))
        .collect();
    }
    return await ctx.db.query("areas").collect();
  },
});

export const getWarehouses = query({
  args: { siteId: v.optional(v.id("sites")) },
  handler: async (ctx: any, args: any) => {
    if (args.siteId) {
      return await ctx.db
        .query("warehouses")
        .withIndex("by_site", (q: any) => q.eq("siteId", args.siteId!))
        .collect();
    }
    return await ctx.db.query("warehouses").collect();
  },
});

export const getUnits = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("units").collect();
  },
});

export const getCategories = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("categories").collect();
  },
});

export const createSite = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("sites", {
      name: args.name,
      code: args.code,
      address: args.address,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
