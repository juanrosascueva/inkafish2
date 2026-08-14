import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const rawTransfers = await ctx.db.query("transfers").order("desc").collect();

    const [sites, warehouses, users, products, units] = await Promise.all([
      ctx.db.query("sites").collect(),
      ctx.db.query("warehouses").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("units").collect(),
    ]);

    const siteMap = new Map((sites as any[]).map((s) => [s._id, s]));
    const whMap = new Map((warehouses as any[]).map((w) => [w._id, w]));
    const userMap = new Map((users as any[]).map((u) => [u._id, u]));
    const prodMap = new Map((products as any[]).map((p) => [p._id, p]));
    const unitMap = new Map((units as any[]).map((u) => [u._id, u]));

    const result = [];
    for (const t of rawTransfers) {
      const items = await ctx.db
        .query("transferItems")
        .withIndex("by_transfer", (q: any) => q.eq("transferId", t._id))
        .collect();

      const mappedItems = items.map((i: any) => {
        const prod = prodMap.get(i.productId);
        const unit = unitMap.get(i.unitId);
        return {
          _id: i._id,
          product: prod ? { _id: prod._id, name: prod.name, code: prod.code } : null,
          unit: unit ? { _id: unit._id, symbol: unit.symbol } : null,
          requestedQuantity: i.requestedQuantity,
          shippedQuantity: i.shippedQuantity || i.requestedQuantity,
          receivedQuantity: i.receivedQuantity,
          lossQuantity: i.lossQuantity || 0,
        };
      });

      result.push({
        _id: t._id,
        transferNumber: t.transferNumber,
        status: t.status,
        plannedDate: t.plannedDate,
        createdAt: t.createdAt,
        notes: t.notes,
        discrepancyNote: t.discrepancyNote,
        originSite: siteMap.get(t.originSiteId) ? { _id: t.originSiteId, name: siteMap.get(t.originSiteId).name } : null,
        destinationSite: siteMap.get(t.destinationSiteId) ? { _id: t.destinationSiteId, name: siteMap.get(t.destinationSiteId).name } : null,
        originWarehouse: t.originWarehouseId && whMap.get(t.originWarehouseId) ? { _id: t.originWarehouseId, name: whMap.get(t.originWarehouseId).name } : null,
        destinationWarehouse: t.destinationWarehouseId && whMap.get(t.destinationWarehouseId) ? { _id: t.destinationWarehouseId, name: whMap.get(t.destinationWarehouseId).name } : null,
        requestedBy: userMap.get(t.requestedBy) ? { _id: t.requestedBy, name: userMap.get(t.requestedBy).name } : null,
        items: mappedItems,
      });
    }

    return result;
  },
});

export const createTransfer = mutation({
  args: {
    originSiteId: v.id("sites"),
    destinationSiteId: v.id("sites"),
    originWarehouseId: v.optional(v.id("warehouses")),
    destinationWarehouseId: v.optional(v.id("warehouses")),
    requestedBy: v.id("users"),
    plannedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        unitId: v.id("units"),
        requestedQuantity: v.number(),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const count = (await ctx.db.query("transfers").collect()).length;
    const transferNumber = `TR-${String(count + 1).padStart(6, "0")}`;

    const transferId = await ctx.db.insert("transfers", {
      transferNumber,
      originSiteId: args.originSiteId,
      destinationSiteId: args.destinationSiteId,
      originWarehouseId: args.originWarehouseId,
      destinationWarehouseId: args.destinationWarehouseId,
      status: "REQUESTED",
      requestedBy: args.requestedBy,
      plannedDate: args.plannedDate,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    for (const item of args.items) {
      await ctx.db.insert("transferItems", {
        transferId,
        productId: item.productId,
        unitId: item.unitId,
        requestedQuantity: item.requestedQuantity,
        shippedQuantity: item.requestedQuantity,
        createdAt: now,
      });
    }

    return transferId;
  },
});

// Transición a EN TRÁNSITO (Guía de Remisión): Descuento atómico FEFO en Origen
export const shipTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    shippedBy: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer || transfer.status !== "REQUESTED") {
      throw new Error("La transferencia debe estar en estado Solicitado para enviarse");
    }

    const items = await ctx.db
      .query("transferItems")
      .withIndex("by_transfer", (q: any) => q.eq("transferId", args.transferId))
      .collect();

    const now = Date.now();

    // Descontar stock de la sede origen por FEFO
    for (const item of items) {
      const allLots = await ctx.db
        .query("lots")
        .withIndex("by_product", (q: any) => q.eq("productId", item.productId))
        .collect();

      const activeLots = allLots.filter((l: any) => l.active && l.remainingQuantity > 0 && l.siteId === transfer.originSiteId);
      activeLots.sort((a: any, b: any) => (a.expiresAt || 9999999999999) - (b.expiresAt || 9999999999999));

      let remaining = item.requestedQuantity;
      for (const lot of activeLots) {
        if (remaining <= 0) break;
        const take = Math.min(lot.remainingQuantity, remaining);
        remaining -= take;

        await ctx.db.patch(lot._id, {
          remainingQuantity: lot.remainingQuantity - take,
          active: lot.remainingQuantity - take > 0,
        });

        await ctx.db.insert("inventoryMovements", {
          movementType: "TRANSFER_OUT",
          productId: item.productId,
          quantity: take,
          unitId: item.unitId,
          siteId: transfer.originSiteId,
          warehouseId: transfer.originWarehouseId,
          lotId: lot._id,
          referenceType: "TRANSFER",
          referenceId: transfer.transferNumber,
          createdBy: args.shippedBy,
          reason: `Despacho Transferencia en Tránsito ${transfer.transferNumber}`,
          createdAt: now,
        });
      }

      // Actualizar balance origen
      const existingBalance = await ctx.db
        .query("inventoryBalances")
        .withIndex("by_product_site", (q: any) =>
          q.eq("productId", item.productId).eq("siteId", transfer.originSiteId)
        )
        .first();

      if (existingBalance) {
        await ctx.db.patch(existingBalance._id, {
          quantity: Math.max(0, existingBalance.quantity - item.requestedQuantity),
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.transferId, {
      status: "IN_TRANSIT",
      shippedBy: args.shippedBy,
      shippedAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});

// Transición a RECIBIDO: Recepción Física + Registro de Mermas en Tránsito si hay faltantes
export const receiveTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    receivedBy: v.id("users"),
    receivedItems: v.array(
      v.object({
        itemId: v.id("transferItems"),
        receivedQuantity: v.number(),
      })
    ),
    discrepancyNote: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer || transfer.status !== "IN_TRANSIT") {
      throw new Error("La transferencia debe estar En Tránsito para recepcionarse");
    }

    const now = Date.now();
    let hasDiscrepancy = false;

    for (const rec of args.receivedItems) {
      const item = await ctx.db.get(rec.itemId);
      if (!item) continue;

      const shipped = item.shippedQuantity || item.requestedQuantity;
      const received = Math.max(0, rec.receivedQuantity);
      const loss = Math.max(0, shipped - received);

      if (loss > 0) hasDiscrepancy = true;

      await ctx.db.patch(item._id, {
        receivedQuantity: received,
        lossQuantity: loss,
      });

      // 1. Ingresar cantidad confirmada a la sede destino
      if (received > 0) {
        const lotNumber = `LOT-TR-${transfer.transferNumber}-${Date.now().toString().slice(-4)}`;
        const lotId = await ctx.db.insert("lots", {
          lotNumber,
          productId: item.productId,
          siteId: transfer.destinationSiteId,
          warehouseId: transfer.destinationWarehouseId,
          receivedQuantity: received,
          remainingQuantity: received,
          receivedAt: now,
          active: true,
          createdAt: now,
        });

        await ctx.db.insert("inventoryMovements", {
          movementType: "TRANSFER_IN",
          productId: item.productId,
          quantity: received,
          unitId: item.unitId,
          siteId: transfer.destinationSiteId,
          warehouseId: transfer.destinationWarehouseId,
          lotId,
          referenceType: "TRANSFER",
          referenceId: transfer.transferNumber,
          createdBy: args.receivedBy,
          reason: `Recepción física Transferencia ${transfer.transferNumber}`,
          createdAt: now,
        });

        const destBalance = await ctx.db
          .query("inventoryBalances")
          .withIndex("by_product_site", (q: any) =>
            q.eq("productId", item.productId).eq("siteId", transfer.destinationSiteId)
          )
          .first();

        if (destBalance) {
          await ctx.db.patch(destBalance._id, {
            quantity: destBalance.quantity + received,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("inventoryBalances", {
            productId: item.productId,
            siteId: transfer.destinationSiteId,
            warehouseId: transfer.destinationWarehouseId,
            quantity: received,
            updatedAt: now,
          });
        }
      }

      // 2. Si hubo pérdida en tránsito, registrar AUTOMÁTICAMENTE la Merma en Tránsito (IN_TRANSIT_LOSS)
      if (loss > 0) {
        await ctx.db.insert("wasteRecords", {
          productId: item.productId,
          unitId: item.unitId,
          quantity: loss,
          stage: "IN_TRANSIT",
          cause: `Discrepancia en recepción de Transferencia ${transfer.transferNumber}`,
          sourceContext: "IN_TRANSIT_LOSS",
          transferId: String(transfer._id),
          siteId: transfer.originSiteId,
          recordedBy: args.receivedBy,
          notes: args.discrepancyNote || `Faltante de ${loss} unidades en tránsito.`,
          createdAt: now,
        });
      }
    }

    await ctx.db.patch(args.transferId, {
      status: "RECEIVED",
      receivedBy: args.receivedBy,
      receivedAt: now,
      discrepancyNote: hasDiscrepancy ? (args.discrepancyNote || "Recepcionado con faltantes en tránsito") : undefined,
      updatedAt: now,
    });

    return { ok: true, hasDiscrepancy };
  },
});
