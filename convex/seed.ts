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
    name: "San Miguel", code: "SM", address: "Av. Principal 123, San Miguel", active: true, createdAt: now, updatedAt: now,
  });

  const linceId = await ctx.db.insert("sites", {
    name: "Lince", code: "LN", address: "Av. Arequipa 456, Lince", active: true, createdAt: now, updatedAt: now,
  });

  // 2. Áreas
  const cocinaSmId = await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Cocina", code: "COC", active: true, createdAt: now });
  const salonSmId = await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Salón", code: "SAL", active: true, createdAt: now });
  const barSmId = await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Bar", code: "BAR", active: true, createdAt: now });
  await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Administración", code: "ADM", active: true, createdAt: now });
  const produccionSmId = await ctx.db.insert("areas", { siteId: sanMiguelId, name: "Producción", code: "PRD", active: true, createdAt: now });
  const cocinaLnId = await ctx.db.insert("areas", { siteId: linceId, name: "Cocina", code: "COC", active: true, createdAt: now });

  // 3. Almacenes
  const almPrinSmId = await ctx.db.insert("warehouses", { siteId: sanMiguelId, name: "Almacén Principal", code: "ALM-PRIN", active: true, createdAt: now });
  const camFrioSmId = await ctx.db.insert("warehouses", { siteId: sanMiguelId, name: "Cámara de Frío", code: "CAM-FRI", active: true, createdAt: now });
  const almAbaLnId = await ctx.db.insert("warehouses", { siteId: linceId, name: "Almacén Abarrotes", code: "ALM-ABA", active: true, createdAt: now });
  const barSmWhId = await ctx.db.insert("warehouses", { siteId: sanMiguelId, name: "Cava de Bar", code: "BAR-CAV", active: true, createdAt: now });

  // 4. Unidades
  const kgUnitId = await ctx.db.insert("units", { name: "Kilogramo", symbol: "KG", allowsDecimals: true, decimalPrecision: 3, active: true, createdAt: now });
  const ltUnitId = await ctx.db.insert("units", { name: "Litro", symbol: "LT", allowsDecimals: true, decimalPrecision: 3, active: true, createdAt: now });
  const undUnitId = await ctx.db.insert("units", { name: "Unidad", symbol: "UND", allowsDecimals: false, decimalPrecision: 0, active: true, createdAt: now });
  const cjaUnitId = await ctx.db.insert("units", { name: "Caja", symbol: "CJA", allowsDecimals: false, decimalPrecision: 0, active: true, createdAt: now });
  const botUnitId = await ctx.db.insert("units", { name: "Botella", symbol: "BOT", allowsDecimals: false, decimalPrecision: 0, active: true, createdAt: now });

  // 5. Categorías
  const abaCatId = await ctx.db.insert("categories", { name: "Abarrotes", code: "ABA", active: true, createdAt: now });
  const proCatId = await ctx.db.insert("categories", { name: "Proteínas", code: "PRO", active: true, createdAt: now });
  const verCatId = await ctx.db.insert("categories", { name: "Verduras", code: "VER", active: true, createdAt: now });
  const bebCatId = await ctx.db.insert("categories", { name: "Bebidas & Licores", code: "BEB", active: true, createdAt: now });
  const limCatId = await ctx.db.insert("categories", { name: "Limpieza", code: "LIM", active: true, createdAt: now });

  // 6. Productos
  const pArrozId = await ctx.db.insert("products", {
    code: "P-000001", name: "Arroz Extra Superior", categoryId: abaCatId, unitId: kgUnitId,
    presentation: "Saco 50kg", brand: "Costeño", tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: 20, active: true, createdAt: now, updatedAt: now
  });

  const pAceiteId = await ctx.db.insert("products", {
    code: "P-000002", name: "Aceite Vegetal Premium", categoryId: abaCatId, unitId: ltUnitId,
    presentation: "Caja 12x1L", brand: "Primor", tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: 10, active: true, createdAt: now, updatedAt: now
  });

  const pPolloId = await ctx.db.insert("products", {
    code: "P-000005", name: "Pollo Entero Fresco", categoryId: proCatId, unitId: kgUnitId,
    presentation: "Jaba 10 unid", brand: "San Fernando", tracksLot: true, tracksExpiry: true, allowsSubstitution: true, minStock: 30, active: true, createdAt: now, updatedAt: now
  });

  const pLomoId = await ctx.db.insert("products", {
    code: "P-000006", name: "Lomo Fino de Res", categoryId: proCatId, unitId: kgUnitId,
    presentation: "Empaque al vacío", brand: "Carnes del Sur", tracksLot: true, tracksExpiry: true, allowsSubstitution: false, minStock: 15, active: true, createdAt: now, updatedAt: now
  });

  const pTomateId = await ctx.db.insert("products", {
    code: "P-000008", name: "Tomate Katia Seleccionado", categoryId: verCatId, unitId: kgUnitId,
    presentation: "Caja 15kg", brand: "Valle Sur", tracksLot: false, tracksExpiry: true, allowsSubstitution: true, minStock: 10, active: true, createdAt: now, updatedAt: now
  });

  const pLimonId = await ctx.db.insert("products", {
    code: "P-000009", name: "Limón Sutil Extra", categoryId: verCatId, unitId: kgUnitId,
    presentation: "Malla 20kg", brand: "Olmos", tracksLot: false, tracksExpiry: true, allowsSubstitution: true, minStock: 15, active: true, createdAt: now, updatedAt: now
  });

  const pPiscoId = await ctx.db.insert("products", {
    code: "P-000010", name: "Pisco Quebranta 750ml", categoryId: bebCatId, unitId: botUnitId,
    presentation: "Botella 750ml", brand: "Cuatro Gallos", tracksLot: false, tracksExpiry: false, allowsSubstitution: false, minStock: 6, active: true, createdAt: now, updatedAt: now
  });

  const pDetergenteId = await ctx.db.insert("products", {
    code: "P-000012", name: "Detergente Desengrasante Industrial", categoryId: limCatId, unitId: ltUnitId,
    presentation: "Bidón 5L", brand: "Sapolio", tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: 4, active: true, createdAt: now, updatedAt: now
  });

  // 7. Proveedores
  const supp1Id = await ctx.db.insert("suppliers", {
    name: "Proveedora Central SAC", documentNumber: "20123456789", contactName: "Carlos Pérez", phone: "999888777", email: "ventas@provcentral.com", active: true, notes: "Proveedor principal abarrotes", createdAt: now, updatedAt: now
  });

  const supp2Id = await ctx.db.insert("suppliers", {
    name: "Frigorífico del Sur EIRL", documentNumber: "20987654321", contactName: "María López", phone: "988777666", email: "pedidos@frigosur.com", active: true, notes: "Carnes y aves de primera", createdAt: now, updatedAt: now
  });

  const supp3Id = await ctx.db.insert("suppliers", {
    name: "Distribuidora Lima Norte", documentNumber: "20456789012", contactName: "Pedro García", phone: "977666555", email: "ventas@limanorte.pe", active: true, notes: "Verduras y frescos", createdAt: now, updatedAt: now
  });

  // 8. Lotes (para probar FEFO)
  const lot1Id = await ctx.db.insert("lots", {
    lotNumber: "LOT-2026-001", productId: pPolloId, warehouseId: camFrioSmId, siteId: sanMiguelId, supplierId: supp2Id,
    receivedQuantity: 50, remainingQuantity: 35, receivedAt: now - 5 * dayMs, expiresAt: now + 2 * dayMs, active: true, createdAt: now
  });

  const lot2Id = await ctx.db.insert("lots", {
    lotNumber: "LOT-2026-002", productId: pPolloId, warehouseId: camFrioSmId, siteId: sanMiguelId, supplierId: supp2Id,
    receivedQuantity: 100, remainingQuantity: 100, receivedAt: now - 2 * dayMs, expiresAt: now + 10 * dayMs, active: true, createdAt: now
  });

  const lot3Id = await ctx.db.insert("lots", {
    lotNumber: "LOT-LOMO-01", productId: pLomoId, warehouseId: camFrioSmId, siteId: sanMiguelId, supplierId: supp2Id,
    receivedQuantity: 30, remainingQuantity: 22.5, receivedAt: now - 3 * dayMs, expiresAt: now + 6 * dayMs, active: true, createdAt: now
  });

  // 9. Saldos de Inventario
  await ctx.db.insert("inventoryBalances", { productId: pArrozId, siteId: sanMiguelId, warehouseId: almPrinSmId, quantity: 200, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pAceiteId, siteId: sanMiguelId, warehouseId: almPrinSmId, quantity: 60, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pPolloId, siteId: sanMiguelId, warehouseId: camFrioSmId, lotId: lot1Id, quantity: 135, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pLomoId, siteId: sanMiguelId, warehouseId: camFrioSmId, lotId: lot3Id, quantity: 22.5, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pTomateId, siteId: sanMiguelId, warehouseId: almPrinSmId, quantity: 40, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pLimonId, siteId: sanMiguelId, warehouseId: almPrinSmId, quantity: 50, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pPiscoId, siteId: sanMiguelId, warehouseId: barSmWhId, quantity: 24, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pArrozId, siteId: linceId, warehouseId: almAbaLnId, quantity: 40, updatedAt: now });
  await ctx.db.insert("inventoryBalances", { productId: pAceiteId, siteId: linceId, warehouseId: almAbaLnId, quantity: 15, updatedAt: now });

  // 10. Usuarios
  const password = bcrypt.hashSync("admin123", 10);
  const userGerenciaId = await ctx.db.insert("users", {
    email: "gerencia@sistema.com", name: "Juan Vila", password, role: "GERENCIA", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userAdminId = await ctx.db.insert("users", {
    email: "admin@sistema.com", name: "Admin Sistema", password, role: "ADMINISTRACION", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userChefId = await ctx.db.insert("users", {
    email: "chef@sistema.com", name: "Chef Ejecutiva", password, role: "CHEF_EJECUTIVA", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userAlmacenId = await ctx.db.insert("users", {
    email: "almacen@sistema.com", name: "Encargado Almacén", password, role: "ALMACEN", siteId: sanMiguelId, active: true, createdAt: now, updatedAt: now
  });
  const userSolicitanteId = await ctx.db.insert("users", {
    email: "solicitante@sistema.com", name: "Solicitante Demo", password, role: "SOLICITANTE", siteId: sanMiguelId, areaId: cocinaSmId, active: true, createdAt: now, updatedAt: now
  });

  // 11. Solicitudes de prueba (Varios estados)
  const req1Id = await ctx.db.insert("requests", {
    requestNumber: "REQ-000001", siteId: sanMiguelId, areaId: cocinaSmId, requestedBy: userSolicitanteId,
    requiredDate: "2026-08-15", shift: "MAÑANA", priority: "URGENT", type: "REGULAR", outOfSchedule: false,
    urgentReason: "Insumo crítico para el menú ejecutivo del mediodía", notes: "Atender prioritariamente",
    status: "PENDING_APPROVAL", createdAt: now - 3600000, updatedAt: now - 3600000
  });

  await ctx.db.insert("requestItems", { requestId: req1Id, productId: pPolloId, requestedQuantity: 15, unitId: kgUnitId, fulfilledQuantity: 0, itemStatus: "PENDING", createdAt: now });
  await ctx.db.insert("requestItems", { requestId: req1Id, productId: pArrozId, requestedQuantity: 10, unitId: kgUnitId, fulfilledQuantity: 0, itemStatus: "PENDING", createdAt: now });

  const req2Id = await ctx.db.insert("requests", {
    requestNumber: "REQ-000002", siteId: sanMiguelId, areaId: barSmId, requestedBy: userSolicitanteId,
    requiredDate: "2026-08-14", shift: "NOCHE", priority: "NORMAL", type: "REGULAR", outOfSchedule: false,
    notes: "Reposición para fin de semana", status: "APPROVED", closedBy: userChefId, createdAt: now - 7200000, updatedAt: now - 3600000
  });

  await ctx.db.insert("requestItems", { requestId: req2Id, productId: pPiscoId, requestedQuantity: 6, unitId: botUnitId, approvedQuantity: 6, fulfilledQuantity: 0, itemStatus: "APPROVED", createdAt: now });
  await ctx.db.insert("requestItems", { requestId: req2Id, productId: pLimonId, requestedQuantity: 5, unitId: kgUnitId, approvedQuantity: 5, fulfilledQuantity: 0, itemStatus: "APPROVED", createdAt: now });

  const req3Id = await ctx.db.insert("requests", {
    requestNumber: "REQ-000003", siteId: sanMiguelId, areaId: cocinaSmId, requestedBy: userSolicitanteId,
    requiredDate: "2026-08-13", shift: "MAÑANA", priority: "NORMAL", type: "REGULAR", outOfSchedule: false,
    status: "IN_PREPARATION", createdAt: now - 14400000, updatedAt: now - 7200000
  });

  await ctx.db.insert("requestItems", { requestId: req3Id, productId: pLomoId, requestedQuantity: 8, unitId: kgUnitId, approvedQuantity: 8, fulfilledQuantity: 4, itemStatus: "PARTIALLY_PREPARED", createdAt: now });

  // 12. Órdenes de Compras
  const pur1Id = await ctx.db.insert("purchases", {
    purchaseNumber: "OC-2026-001", supplierId: supp2Id, siteId: sanMiguelId, warehouseId: camFrioSmId,
    requestedBy: userAlmacenId, approvedBy: userAdminId, status: "APPROVED", expectedDate: "2026-08-16",
    documentNumber: "FAC-F001-0982", totalAmount: 850.00, currency: "PEN", notes: "Compra semanal de carne y pollo", createdAt: now - 86400000, updatedAt: now
  });

  await ctx.db.insert("purchaseItems", { purchaseId: pur1Id, productId: pPolloId, unitId: kgUnitId, quantity: 50, unitPrice: 9.50, receivedQuantity: 50, createdAt: now });
  await ctx.db.insert("purchaseItems", { purchaseId: pur1Id, productId: pLomoId, unitId: kgUnitId, quantity: 10, unitPrice: 37.50, receivedQuantity: 10, createdAt: now });

  // 13. Órdenes de Producción
  const prod1Id = await ctx.db.insert("productionOrders", {
    productionOrderNumber: "OP-000001", siteId: sanMiguelId, productionAreaId: produccionSmId, plannedDate: "2026-08-14",
    shift: "MAÑANA", status: "IN_PROGRESS", totalInputQuantity: 20, totalOutputQuantity: 17.5, wasteQuantity: 2.5, yieldPercentage: 87.5,
    createdBy: userChefId, startedBy: userChefId, startedAt: now - 1800000, notes: "Despiece de pollo para pechugas y piernas", createdAt: now - 3600000, updatedAt: now
  });

  await ctx.db.insert("productionInputs", { productionOrderId: prod1Id, productId: pPolloId, unitId: kgUnitId, warehouseId: camFrioSmId, plannedQuantity: 20, actualQuantity: 20, createdAt: now });

  // 14. Mermas de Prueba (Almacén vs Producción)
  await ctx.db.insert("wasteRecords", {
    productId: pTomateId, unitId: kgUnitId, quantity: 2.5, stage: "PRODUCTION", cause: "Maduración excesiva en preparación",
    areaId: cocinaSmId, siteId: sanMiguelId, warehouseId: almPrinSmId, recordedBy: userSolicitanteId, costEstimate: 12.50,
    actionTaken: "Desecho en contenedor orgánico", notes: "Merma en etapa de producción (analítica, sin doble descuento)", createdAt: now - 7200000
  });

  await ctx.db.insert("wasteRecords", {
    productId: pLimonId, unitId: kgUnitId, quantity: 1.2, stage: "STORAGE", cause: "Deterioro en almacenamiento",
    siteId: sanMiguelId, warehouseId: almPrinSmId, recordedBy: userAlmacenId, costEstimate: 6.00,
    actionTaken: "Baja de inventario", notes: "Merma en almacén (descuenta stock disponible)", createdAt: now - 3600000
  });

  return { status: "force_seeded_with_full_scenario" };
}


