import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("suppliers").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    documentNumber: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    return await ctx.db.insert("suppliers", {
      ...args,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.string(),
    documentNumber: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, {
      ...data,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const toggleActive = mutation({
  args: {
    id: v.id("suppliers"),
  },
  handler: async (ctx: any, args: any) => {
    const supplier = await ctx.db.get(args.id);
    if (!supplier) throw new Error("Proveedor no encontrado");

    await ctx.db.patch(args.id, {
      active: !supplier.active,
      updatedAt: Date.now(),
    });
    return true;
  },
});
