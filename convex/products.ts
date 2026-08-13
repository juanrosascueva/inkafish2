import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { categoryId: v.optional(v.id("categories")) },
  handler: async (ctx: any, args: any) => {
    if (args.categoryId) {
      return await ctx.db
        .query("products")
        .withIndex("by_category", (q: any) => q.eq("categoryId", args.categoryId!))
        .collect();
    }
    return await ctx.db.query("products").collect();
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("products")
      .withIndex("by_code", (q: any) => q.eq("code", args.code))
      .first();
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    categoryId: v.id("categories"),
    subcategoryId: v.optional(v.id("subcategories")),
    unitId: v.id("units"),
    presentation: v.optional(v.string()),
    brand: v.optional(v.string()),
    tracksLot: v.boolean(),
    tracksExpiry: v.boolean(),
    allowsSubstitution: v.boolean(),
    minStock: v.number(),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
