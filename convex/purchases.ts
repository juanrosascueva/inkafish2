import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.query("purchases").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    supplierId: v.id("suppliers"),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    requestedBy: v.id("users"),
    expectedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    currency: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        unitId: v.id("units"),
        quantity: v.number(),
        unitPrice: v.optional(v.number()),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const count = (await ctx.db.query("purchases").collect()).length + 1;
    const purchaseNumber = `PO-${String(count).padStart(6, "0")}`;

    const totalAmount = args.items.reduce(
      (sum: number, item: any) => sum + item.quantity * (item.unitPrice ?? 0),
      0
    );

    const purchaseId = await ctx.db.insert("purchases", {
      purchaseNumber,
      supplierId: args.supplierId,
      siteId: args.siteId,
      warehouseId: args.warehouseId,
      requestedBy: args.requestedBy,
      status: "DRAFT",
      expectedDate: args.expectedDate,
      notes: args.notes,
      totalAmount,
      currency: args.currency,
      createdAt: now,
      updatedAt: now,
    });

    for (const item of args.items) {
      await ctx.db.insert("purchaseItems", {
        purchaseId,
        productId: item.productId,
        unitId: item.unitId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        receivedQuantity: 0,
        pendingQuantity: item.quantity,
        notes: item.notes,
        createdAt: now,
      });
    }

    return purchaseId;
  },
});
