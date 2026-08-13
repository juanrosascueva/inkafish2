import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    if (args.status) {
      return await ctx.db
        .query("requests")
        .withIndex("by_status", (q: any) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("requests").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("requests") },
  handler: async (ctx: any, args: any) => {
    const request = await ctx.db.get(args.id);
    if (!request) return null;
    const items = await ctx.db
      .query("requestItems")
      .withIndex("by_request", (q: any) => q.eq("requestId", args.id))
      .collect();
    return { ...request, items };
  },
});

export const create = mutation({
  args: {
    siteId: v.id("sites"),
    areaId: v.id("areas"),
    requestedBy: v.id("users"),
    requiredDate: v.string(),
    shift: v.optional(v.string()),
    priority: v.string(),
    type: v.string(),
    outOfSchedule: v.boolean(),
    urgentReason: v.optional(v.string()),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        productNameTemp: v.optional(v.string()),
        requestedQuantity: v.number(),
        unitId: v.id("units"),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const count = (await ctx.db.query("requests").collect()).length + 1;
    const requestNumber = `REQ-${String(count).padStart(6, "0")}`;

    const requestId = await ctx.db.insert("requests", {
      requestNumber,
      siteId: args.siteId,
      areaId: args.areaId,
      requestedBy: args.requestedBy,
      requiredDate: args.requiredDate,
      shift: args.shift,
      priority: args.priority,
      type: args.type,
      outOfSchedule: args.outOfSchedule,
      urgentReason: args.urgentReason,
      notes: args.notes,
      status: "PENDING_APPROVAL",
      createdAt: now,
      updatedAt: now,
    });

    for (const item of args.items) {
      await ctx.db.insert("requestItems", {
        requestId,
        productId: item.productId,
        productNameTemp: item.productNameTemp,
        requestedQuantity: item.requestedQuantity,
        unitId: item.unitId,
        fulfilledQuantity: 0,
        pendingQuantity: item.requestedQuantity,
        itemStatus: "PENDING",
        notes: item.notes,
        createdAt: now,
      });
    }

    return requestId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("requests"),
    status: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
