import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const rawTransfers = await ctx.db.query("requests").collect();
    // Filtramos o traemos solicitudes tipo TRANSFER o las especificas
    const transfersOnly = rawTransfers.filter((r: any) => r.type === "TRANSFER");

    const [sites, warehouses, users] = await Promise.all([
      ctx.db.query("sites").collect(),
      ctx.db.query("warehouses").collect(),
      ctx.db.query("users").collect(),
    ]);

    const siteMap = new Map((sites as any[]).map((s) => [s._id, s]));
    const whMap = new Map((warehouses as any[]).map((w) => [w._id, w]));
    const userMap = new Map((users as any[]).map((u) => [u._id, u]));

    return transfersOnly.map((t: any) => {
      const originSite = siteMap.get(t.siteId);
      return {
        _id: t._id,
        transferNumber: t.requestNumber.replace("REQ-", "TR-"),
        status: t.status,
        requiredDate: t.requiredDate,
        createdAt: t.createdAt,
        notes: t.notes,
        originSite: originSite ? { _id: originSite._id, name: originSite.name, code: originSite.code } : null,
        destinationSite: { name: "Lince" }, // Sede destino por defecto para demos
        requestedBy: userMap.get(t.requestedBy) ? { _id: t.requestedBy, name: userMap.get(t.requestedBy).name } : null,
      };
    });
  },
});
