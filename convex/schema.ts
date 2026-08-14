import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Sedes
  sites: defineTable({
    name: v.string(),
    code: v.string(),
    address: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  // Áreas
  areas: defineTable({
    siteId: v.id("sites"),
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_site", ["siteId"]),

  // Almacenes
  warehouses: defineTable({
    siteId: v.id("sites"),
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_site", ["siteId"]),

  // Ubicaciones
  locations: defineTable({
    warehouseId: v.id("warehouses"),
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_warehouse", ["warehouseId"]),

  // Unidades
  units: defineTable({
    name: v.string(),
    symbol: v.string(),
    allowsDecimals: v.boolean(),
    decimalPrecision: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  }),

  // Categorías
  categories: defineTable({
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // Subcategorías
  subcategories: defineTable({
    categoryId: v.id("categories"),
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_category", ["categoryId"]),

  // Productos
  products: defineTable({
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
    active: v.boolean(),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_category", ["categoryId"]),

  // Usuarios
  users: defineTable({
    email: v.string(),
    name: v.string(),
    password: v.string(),
    role: v.string(),
    siteId: v.optional(v.id("sites")),
    areaId: v.optional(v.id("areas")),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  // Sesiones
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  // Proveedores
  suppliers: defineTable({
    name: v.string(),
    documentNumber: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    active: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Lotes
  lots: defineTable({
    lotNumber: v.string(),
    productId: v.id("products"),
    warehouseId: v.optional(v.id("warehouses")),
    locationId: v.optional(v.id("locations")),
    siteId: v.optional(v.id("sites")),
    supplierId: v.optional(v.id("suppliers")),
    receivedQuantity: v.number(),
    remainingQuantity: v.number(),
    receivedAt: v.number(),
    expiresAt: v.optional(v.number()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_product", ["productId"]),

  // Movimientos de Inventario
  inventoryMovements: defineTable({
    movementType: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
    unitId: v.id("units"),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    locationId: v.optional(v.id("locations")),
    lotId: v.optional(v.id("lots")),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_site", ["siteId"]),

  // Saldos de Inventario
  inventoryBalances: defineTable({
    productId: v.id("products"),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    locationId: v.optional(v.id("locations")),
    lotId: v.optional(v.id("lots")),
    quantity: v.number(),
    updatedAt: v.number(),
  }).index("by_product_site", ["productId", "siteId"]),

  // Solicitudes
  requests: defineTable({
    requestNumber: v.string(),
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
    status: v.string(),
    closedBy: v.optional(v.id("users")),
    closedReason: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_request_number", ["requestNumber"])
    .index("by_site", ["siteId"])
    .index("by_status", ["status"]),

  // Ítems de Solicitud
  requestItems: defineTable({
    requestId: v.id("requests"),
    productId: v.optional(v.id("products")),
    productNameTemp: v.optional(v.string()),
    requestedQuantity: v.number(),
    unitId: v.id("units"),
    approvedQuantity: v.optional(v.number()),
    fulfilledQuantity: v.number(),
    pendingQuantity: v.optional(v.number()),
    itemStatus: v.string(),
    approvalComment: v.optional(v.string()),
    substituteProductId: v.optional(v.id("products")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_request", ["requestId"]),

  // Compras
  purchases: defineTable({
    purchaseNumber: v.string(),
    supplierId: v.id("suppliers"),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    requestedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    status: v.string(),
    expectedDate: v.optional(v.string()),
    documentNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    currency: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_purchase_number", ["purchaseNumber"])
    .index("by_supplier", ["supplierId"]),

  // Ítems de Compra
  purchaseItems: defineTable({
    purchaseId: v.id("purchases"),
    productId: v.id("products"),
    unitId: v.id("units"),
    quantity: v.number(),
    unitPrice: v.optional(v.number()),
    receivedQuantity: v.number(),
    pendingQuantity: v.optional(v.number()),
    lotNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_purchase", ["purchaseId"]),

  // Órdenes de Producción
  productionOrders: defineTable({
    productionOrderNumber: v.string(),
    siteId: v.id("sites"),
    productionAreaId: v.optional(v.id("areas")),
    plannedDate: v.string(),
    shift: v.optional(v.string()),
    status: v.string(),
    totalInputQuantity: v.optional(v.number()),
    totalOutputQuantity: v.optional(v.number()),
    wasteQuantity: v.optional(v.number()),
    yieldPercentage: v.optional(v.number()),
    createdBy: v.id("users"),
    startedBy: v.optional(v.id("users")),
    completedBy: v.optional(v.id("users")),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_number", ["productionOrderNumber"]),

  // Entradas de Producción (Inputs)
  productionInputs: defineTable({
    productionOrderId: v.id("productionOrders"),
    productId: v.id("products"),
    unitId: v.id("units"),
    warehouseId: v.optional(v.id("warehouses")),
    plannedQuantity: v.optional(v.number()),
    actualQuantity: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_production_order", ["productionOrderId"]),

  // Salidas de Producción (Outputs)
  productionOutputs: defineTable({
    productionOrderId: v.id("productionOrders"),
    outputProductId: v.id("products"),
    unitId: v.id("units"),
    destinationWarehouseId: v.optional(v.id("warehouses")),
    quantity: v.number(),
    lotNumber: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_production_order", ["productionOrderId"]),

  // Mermas
  wasteRecords: defineTable({
    productId: v.id("products"),
    unitId: v.id("units"),
    quantity: v.number(),
    stage: v.string(),
    cause: v.string(),
    sourceContext: v.optional(v.string()), // "STORAGE" | "PRODUCTION_DISCARD" | "IN_TRANSIT_LOSS" | "EXPIRED"
    productionOrderId: v.optional(v.id("productionOrders")),
    transferId: v.optional(v.string()),
    areaId: v.optional(v.id("areas")),
    siteId: v.id("sites"),
    warehouseId: v.optional(v.id("warehouses")),
    recordedBy: v.id("users"),
    costEstimate: v.optional(v.number()),
    actionTaken: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_site", ["siteId"]),

  // Transferencias entre Sedes (3 Estados: REQUESTED -> IN_TRANSIT -> RECEIVED)
  transfers: defineTable({
    transferNumber: v.string(),
    originSiteId: v.id("sites"),
    destinationSiteId: v.id("sites"),
    originWarehouseId: v.optional(v.id("warehouses")),
    destinationWarehouseId: v.optional(v.id("warehouses")),
    status: v.string(), // "REQUESTED" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED"
    requestedBy: v.id("users"),
    shippedBy: v.optional(v.id("users")),
    receivedBy: v.optional(v.id("users")),
    plannedDate: v.optional(v.string()),
    shippedAt: v.optional(v.number()),
    receivedAt: v.optional(v.number()),
    discrepancyNote: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_origin_site", ["originSiteId"])
    .index("by_destination_site", ["destinationSiteId"])
    .index("by_status", ["status"]),

  // Ítems de Transferencia
  transferItems: defineTable({
    transferId: v.id("transfers"),
    productId: v.id("products"),
    unitId: v.id("units"),
    requestedQuantity: v.number(),
    shippedQuantity: v.optional(v.number()),
    receivedQuantity: v.optional(v.number()),
    lossQuantity: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_transfer", ["transferId"]),
});
