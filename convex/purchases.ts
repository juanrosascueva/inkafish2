import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.query("purchases").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("purchases") },
  handler: async (ctx: any, args: any) => {
    const purchase = await ctx.db.get(args.id);
    if (!purchase) return null;

    const items = await ctx.db
      .query("purchaseItems")
      .withIndex("by_purchase", (q: any) => q.eq("purchaseId", args.id))
      .collect();

    const supplier = await ctx.db.get(purchase.supplierId);
    const site = await ctx.db.get(purchase.siteId);
    const warehouse = purchase.warehouseId ? await ctx.db.get(purchase.warehouseId) : null;
    const requestedByUser = await ctx.db.get(purchase.requestedBy);

    return {
      ...purchase,
      supplier,
      site,
      warehouse,
      requestedByUser,
      items,
    };
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
      status: "PENDING",
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

export const updateStatus = mutation({
  args: {
    id: v.id("purchases"),
    status: v.string(),
    approvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const updateData: any = {
      status: args.status,
      updatedAt: now,
    };
    if (args.approvedBy) {
      updateData.approvedBy = args.approvedBy;
    }
    await ctx.db.patch(args.id, updateData);
    return true;
  },
});

export const receivePurchase = mutation({
  args: {
    id: v.id("purchases"),
    receivedBy: v.id("users"),
    documentNumber: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const purchase = await ctx.db.get(args.id);
    if (!purchase) throw new Error("Orden de compra no encontrada");
    if (purchase.status === "RECEIVED") throw new Error("Esta orden ya ha sido recibida previamente");

    const items = await ctx.db
      .query("purchaseItems")
      .withIndex("by_purchase", (q: any) => q.eq("purchaseId", args.id))
      .collect();

    const targetWarehouseId = purchase.warehouseId;
    if (!targetWarehouseId) throw new Error("La compra no tiene un almacén destino especificado");

    // Process each item to load into inventory
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;

      let lotId: any = undefined;

      // Create lot if product tracks lots/expiration
      if (product.tracksLot || product.tracksExpiry) {
        const lotNumber = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const expiresAt = product.tracksExpiry ? now + 15 * 24 * 60 * 60 * 1000 : undefined; // Default 15 days expiry

        lotId = await ctx.db.insert("lots", {
          lotNumber,
          productId: item.productId,
          warehouseId: targetWarehouseId,
          siteId: purchase.siteId,
          supplierId: purchase.supplierId,
          receivedQuantity: item.quantity,
          remainingQuantity: item.quantity,
          receivedAt: now,
          expiresAt,
          active: true,
          createdAt: now,
        });
      }

      // Update or create inventory balance
      const existingBalances = await ctx.db
        .query("inventoryBalances")
        .withIndex("by_product", (q: any) => q.eq("productId", item.productId))
        .collect();

      const matchingBalance = existingBalances.find(
        (b: any) => b.warehouseId === targetWarehouseId && b.lotId === lotId
      );

      if (matchingBalance) {
        await ctx.db.patch(matchingBalance._id, {
          quantity: matchingBalance.quantity + item.quantity,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("inventoryBalances", {
          productId: item.productId,
          siteId: purchase.siteId,
          warehouseId: targetWarehouseId,
          lotId,
          quantity: item.quantity,
          updatedAt: now,
        });
      }

      // Record movement
      await ctx.db.insert("inventoryMovements", {
        movementType: "PURCHASE_RECEIPT",
        productId: item.productId,
        quantity: item.quantity,
        unitId: item.unitId,
        siteId: purchase.siteId,
        destinationWarehouseId: targetWarehouseId,
        lotId,
        referenceType: "PURCHASE",
        referenceId: purchase.purchaseNumber,
        performedBy: args.receivedBy,
        movementDate: now,
        createdAt: now,
      });

      // Update purchase item received quantity
      await ctx.db.patch(item._id, {
        receivedQuantity: item.quantity,
        pendingQuantity: 0,
      });
    }

    // Update purchase status
    await ctx.db.patch(args.id, {
      status: "RECEIVED",
      documentNumber: args.documentNumber || purchase.documentNumber,
      updatedAt: now,
    });

    return true;
  },
});
