import { mutation } from "./_generated/server";
import bcrypt from "bcryptjs";

export const run = mutation({
  handler: async (ctx: any) => {
    const existingSites = await ctx.db.query("sites").collect();
    if (existingSites.length > 0) return { status: "already_seeded" };
    return await seedData(ctx);
  },
});

export const forceSeed = mutation({
  handler: async (ctx: any) => {
    // Clear previous data
    const tables = [
      "sites", "areas", "warehouses", "locations", "units", "categories",
      "subcategories", "products", "users", "sessions", "suppliers",
      "lots", "inventoryMovements", "inventoryBalances", "requests",
      "requestItems", "purchases", "purchaseItems", "productionOrders",
      "productionInputs", "productionOutputs", "wasteRecords"
    ];

    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      for (const rec of records) {
        await ctx.db.delete(rec._id);
      }
    }

    return await seedData(ctx);
  },
});

async function seedData(ctx: any) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Sedes
  const sanMiguelId = await ctx.db.insert("sites", {
    name: "San Miguel",
    code: "SM",
    address: "Av. Principal 123, San Miguel",
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const linceId = await ctx.db.insert("sites", {
    name: "Lince",
    code: "LN",
    address: "Av. Arequipa 456, Lince",
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Áreas
  const cocinaSmId = await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Cocina", code: "COC", active: true, createdAt: now });
  await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Salón", code: "SAL", active: true, createdAt: now });
  await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Bar", code: "BAR", active: true, createdAt: now });
  await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Administración", code: "ADM", active: true, createdAt: now });
  const produccionSmId = await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Producción", code: "PRD", active: true, createdAt: now });

  // 3. Almacenes
  const almPrinSmId = await ctx.db.insert("warehouses", { siteId: sanMiguelId, name: "Almacén Principal", code: "ALM-PRIN", active: true, createdAt: now });
  const camFrioSmId = await ctx.db.insert("warehouses", { siteId: sanMiguelId, name: "Cámara de Frío", code: "CAM-FRI", active: true, createdAt: now });
  const almAbaLnId = await ctx.db.insert("warehouses", { siteId: linceId, name: "Almacén Abarrotes", code: "ALM-ABA", active: true, createdAt: now });

  // 4. Unidades
  const kgUnitId = await ctx.db.insert("units", { name: "Kilogramo", symbol: "KG", allowsDecimals: true, decimalPrecision: 3, active: true, createdAt: now });
  const ltUnitId = await ctx.db.insert("units", { name: "Litro", symbol: "LT", allowsDecimals: true, decimalPrecision: 3, active: true, createdAt: now });
  const undUnitId = await ctx.db.insert("units", { name: "Unidad", symbol: "UND", allowsDecimals: false, decimalPrecision: 0, active: true, createdAt: now });

  // 5. Categorías
  const abaCatId = await ctx.db.insert("categories", { name: "Abarrotes", code: "ABA", active: true, createdAt: now });
  const proCatId = await ctx.db.insert("categories", { name: "Proteínas", code: "PRO", active: true, createdAt: now });
  const verCatId = await ctx.db.insert("categories", { name: "Verduras", code: "VER", active: true, createdAt: now });

  // 6. Productos
  const pArrozId = await ctx.db.insert("products", {
    code: "P-000001", name: "Arroz Extra", categoryId: abaCatId, unitId: kgUnitId,
    tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: 10, active: true, createdAt: now, updatedAt: now
  });

  const pAceiteId = await ctx.db.insert("products", {
    code: "P-000002", name: "Aceite Vegetal", categoryId: abaCatId, unitId: ltUnitId,
    tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: 5, active: true, createdAt: now, updatedAt: now
  });

  const pPolloId = await ctx.db.insert("products", {
    code: "P-000005", name: "Pollo Entero", categoryId: proCatId, unitId: kgUnitId,
    tracksLot: true, tracksExpiry: true, allowsSubstitution: true, minStock: 20, active: true, createdAt: now, updatedAt: now
  });

  const pTomateId = await ctx.db.insert("products", {
    code: "P-000008", name: "Tomate Katia", categoryId: verCatId, unitId: kgUnitId,
    tracksLot: false, tracksExpiry: true, allowsSubstitution: true, minStock: 8, active: true, createdAt: now, updatedAt: now
  });

  // 7. Proveedores
  const supp1Id = await ctx.db.insert("suppliers", {
    name: "Proveedora Central SAC", documentNumber: "20123456789", contactName: "Carlos Pérez", phone: "999888777", email: "ventas@provcentral.com", active: true, createdAt: now, updatedAt: now
  });

  // 8. Lotes (para probar FEFO)
  const lot1Id = await ctx.db.insert("lots", {
    lotNumber: "LOT-2026-001", productId: pPolloId, warehouseId: camFrioSmId, siteId: sanMiguelId, supplierId: supp1Id,
    receivedQuantity: 50, remainingQuantity: 35, receivedAt: now - 5 * dayMs, expiresAt: now + 3 * dayMs, active: true, createdAt: now
  });

  await ctx.db.insert("lots", {
    lotNumber: "LOT-2026-002", productId: pPolloId, warehouseId: camFrioSmId, siteId: sanMiguelId, supplierId: supp1Id,
    receivedQuantity: 100, remainingQuantity: 100, receivedAt: now - 2 * dayMs, expiresAt: now + 12 * dayMs, active: true, createdAt: now
  });

  // 9. Saldos de Inventario
  await ctx.db.insert("inventoryBalances", { productId: pArrozId, siteId: sanMiguelId, warehouseId: almPrinSmId, quantity: 150, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pAceiteId, siteId: sanMiguelId, warehouseId: almPrinSmId, quantity: 45, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pPolloId, siteId: sanMiguelId, warehouseId: camFrioSmId, lotId: lot1Id, quantity: 135, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pArrozId, siteId: linceId, warehouseId: almAbaLnId, quantity: 30, updatedAt: now });

  // 10. Usuarios
  const password = bcrypt.hashSync("admin123", 10);
  const userGerenciaId = await ctx.db.insert("users", {
    email: "gerencia@sistema.com", name: "Juan Vila", password, role: "GERENCIA", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userAdminId = await ctx.db.insert("users", {
    email: "admin@sistema.com", name: "Admin Sistema", password, role: "ADMINISTRACION", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  await ctx.db.insert("users", {
    email: "chef@sistema.com", name: "Chef Ejecutiva", password, role: "CHEF_EJECUTIVA", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userAlmacenId = await ctx.db.insert("users", {
    email: "almacen@sistema.com", name: "Encargado Almacén", password, role: "ALMACEN", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userSolicitanteId = await ctx.db.insert("users", {
    email: "solicitante@sistema.com", name: "Solicitante Demo", password, role: "SOLICITANTE", siteId: sanMiguelId, areaId: cocinaSmId, active: true, createdAt: now, updatedAt: now
  });

  // 11. Solicitudes de prueba
  const req1Id = await ctx.db.insert("requests", {
    requestNumber: "REQ-000001", siteId: sanMiguelId, areaId: cocinaSmId, requestedBy: userSolicitanteId,
    requiredDate: "2026-08-15", shift: "MAÑANA", priority: "URGENT", type: "REGULAR", outOfSchedule: false,
    urgentReason: "Insumo crítico para el menú ejecutivo del día", notes: "Por favor atender a primera hora",
    status: "PENDING_APPROVAL", createdAt: now - 3600000, updatedAt: now - 3600000
  });

  await ctx.db.insert("requestItems", {
    requestId: req1Id, productId: pPolloId, requestedQuantity: 15, unitId: kgUnitId, fulfilledQuantity: 0, itemStatus: "PENDING", createdAt: now
  });
  await ctx.db.insert("requestItems", {
    requestId: req1Id, productId: pArrozId, requestedQuantity: 10, unitId: kgUnitId, fulfilledQuantity: 0, itemStatus: "PENDING", createdAt: now
  });

  // 12. Registro de Mermas de prueba (Demostrando no doble descuento)
  await ctx.db.insert("wasteRecords", {
    productId: pTomateId, unitId: kgUnitId, quantity: 2.5, stage: "PRODUCTION", cause: "Maduración excesiva en preparación",
    areaId: cocinaSmId, siteId: sanMiguelId, warehouseId: almPrinSmId, recordedBy: userSolicitanteId, costEstimate: 12.50,
    actionTaken: "Desecho en contenedor orgánico", notes: "Merma en etapa de producción no descuenta inventario doble", createdAt: now - 7200000
  });

  return { status: "force_seeded_with_full_scenario" };
}

