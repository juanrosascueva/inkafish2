import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  serial,
  pgEnum,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", [
  "GERENCIA",
  "ADMINISTRACION",
  "CHEF_EJECUTIVA",
  "JEFE_COCINA",
  "JEFE_SALON",
  "JEFE_BAR",
  "ALMACEN",
  "PRODUCCION",
  "RESPONSABLE_AREA",
  "SOLICITANTE",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "PARTIALLY_APPROVED",
  "APPROVED",
  "REJECTED",
  "IN_PREPARATION",
  "PARTIALLY_DISPATCHED",
  "DISPATCHED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "OBSERVED",
  "CLOSED_INCOMPLETE",
  "CANCELLED",
]);

export const requestPriorityEnum = pgEnum("request_priority", [
  "NORMAL",
  "URGENT",
]);

export const requestTypeEnum = pgEnum("request_type", [
  "REGULAR",
  "EXTRAORDINARY",
  "URGENT",
]);

export const itemStatusEnum = pgEnum("item_status", [
  "PENDING",
  "PREPARED",
  "PARTIALLY_PREPARED",
  "NOT_AVAILABLE",
  "SUBSTITUTED",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "PURCHASE_RECEIPT",
  "WAREHOUSE_ENTRY",
  "INTERNAL_DISPATCH",
  "INTERNAL_RECEIPT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "PRODUCTION_CONSUMPTION",
  "PRODUCTION_OUTPUT",
  "WASTE",
  "RETURN",
  "ADJUSTMENT_POSITIVE",
  "ADJUSTMENT_NEGATIVE",
  "REVERSAL",
]);

export const transferStatusEnum = pgEnum("transfer_status", [
  "DRAFT",
  "PREPARED",
  "DISPATCHED",
  "IN_TRANSIT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "DRAFT",
  "APPROVED",
  "ORDERED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);

export const productionStatusEnum = pgEnum("production_status", [
  "DRAFT",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const wasteStageEnum = pgEnum("waste_stage", [
  "STORAGE",
  "PRODUCTION",
  "PREPARATION",
  "SERVICE",
  "RETURN",
  "OTHER",
]);

export const entryOriginEnum = pgEnum("entry_origin", [
  "SUPPLIER",
  "TRANSFER",
  "RETURN",
  "INITIAL_STOCK",
  "ADJUSTMENT",
  "OTHER",
]);

export const receiptStatusEnum = pgEnum("receipt_status", [
  "COMPLIANT",
  "OBSERVED",
  "REJECTED",
]);

// ─── Master Tables ─────────────────────────────────────────────────────────────

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  allowsDecimals: boolean("allows_decimals").notNull().default(false),
  decimalPrecision: integer("decimal_precision").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  presentation: text("presentation"),
  brand: text("brand"),
  tracksLot: boolean("tracks_lot").notNull().default(false),
  tracksExpiry: boolean("tracks_expiry").notNull().default(false),
  allowsSubstitution: boolean("allows_substitution").notNull().default(true),
  minStock: decimal("min_stock", { precision: 12, scale: 3 }).default("0"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productAreaAccess = pgTable("product_area_access", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  areaId: integer("area_id").notNull().references(() => areas.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Users & Auth ──────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("SOLICITANTE"),
  siteId: integer("site_id").references(() => sites.id),
  areaId: integer("area_id").references(() => areas.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Suppliers ─────────────────────────────────────────────────────────────────

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  documentNumber: text("document_number"),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supplierPrices = pgTable("supplier_prices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  price: decimal("price", { precision: 12, scale: 4 }).notNull(),
  currency: text("currency").notNull().default("PEN"),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Lots ──────────────────────────────────────────────────────────────────────

export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  lotNumber: text("lot_number").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => locations.id),
  siteId: integer("site_id").references(() => sites.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  receivedQuantity: decimal("received_quantity", { precision: 12, scale: 3 }).notNull(),
  remainingQuantity: decimal("remaining_quantity", { precision: 12, scale: 3 }).notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Inventory ─────────────────────────────────────────────────────────────────

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  movementType: movementTypeEnum("movement_type").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unitId: integer("unit_id").notNull().references(() => units.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => locations.id),
  lotId: integer("lot_id").references(() => lots.id),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  reason: text("reason"),
  reversalOf: integer("reversal_of"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventoryBalances = pgTable("inventory_balances", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => locations.id),
  lotId: integer("lot_id").references(() => lots.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Requests ─────────────────────────────────────────────────────────────────

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  areaId: integer("area_id").notNull().references(() => areas.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  requiredDate: date("required_date").notNull(),
  shift: text("shift"),
  priority: requestPriorityEnum("priority").notNull().default("NORMAL"),
  type: requestTypeEnum("type").notNull().default("REGULAR"),
  outOfSchedule: boolean("out_of_schedule").notNull().default(false),
  urgentReason: text("urgent_reason"),
  notes: text("notes"),
  status: requestStatusEnum("status").notNull().default("DRAFT"),
  closedBy: integer("closed_by").references(() => users.id),
  closedReason: text("closed_reason"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const requestItems = pgTable("request_items", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  productId: integer("product_id").references(() => products.id),
  productNameTemp: text("product_name_temp"),
  requestedQuantity: decimal("requested_quantity", { precision: 12, scale: 3 }).notNull(),
  unitId: integer("unit_id").notNull().references(() => units.id),
  approvedQuantity: decimal("approved_quantity", { precision: 12, scale: 3 }),
  fulfilledQuantity: decimal("fulfilled_quantity", { precision: 12, scale: 3 }).default("0"),
  pendingQuantity: decimal("pending_quantity", { precision: 12, scale: 3 }),
  itemStatus: itemStatusEnum("item_status").notNull().default("PENDING"),
  approvalComment: text("approval_comment"),
  substituteProductId: integer("substitute_product_id").references(() => products.id),
  substituteReason: text("substitute_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const requestApprovals = pgTable("request_approvals", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  requestItemId: integer("request_item_id").references(() => requestItems.id),
  approvedBy: integer("approved_by").notNull().references(() => users.id),
  action: text("action").notNull(),
  originalQuantity: decimal("original_quantity", { precision: 12, scale: 3 }),
  approvedQuantity: decimal("approved_quantity", { precision: 12, scale: 3 }),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Dispatches & Receipts ────────────────────────────────────────────────────

export const dispatches = pgTable("dispatches", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  dispatchNumber: text("dispatch_number").notNull().unique(),
  preparedBy: integer("prepared_by").references(() => users.id),
  dispatchedBy: integer("dispatched_by").references(() => users.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  notes: text("notes"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dispatchItems = pgTable("dispatch_items", {
  id: serial("id").primaryKey(),
  dispatchId: integer("dispatch_id").notNull().references(() => dispatches.id),
  requestItemId: integer("request_item_id").notNull().references(() => requestItems.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unitId: integer("unit_id").notNull().references(() => units.id),
  lotId: integer("lot_id").references(() => lots.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  dispatchId: integer("dispatch_id").notNull().references(() => dispatches.id),
  requestId: integer("request_id").notNull().references(() => requests.id),
  receivedBy: integer("received_by").notNull().references(() => users.id),
  receiptNumber: text("receipt_number").notNull().unique(),
  status: receiptStatusEnum("status").notNull().default("COMPLIANT"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => receipts.id),
  dispatchItemId: integer("dispatch_item_id").notNull().references(() => dispatchItems.id),
  productId: integer("product_id").notNull().references(() => products.id),
  receivedQuantity: decimal("received_quantity", { precision: 12, scale: 3 }).notNull(),
  unitId: integer("unit_id").notNull().references(() => units.id),
  status: receiptStatusEnum("status").notNull().default("COMPLIANT"),
  incidentReason: text("incident_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Transfers ─────────────────────────────────────────────────────────────────

export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  transferNumber: text("transfer_number").notNull().unique(),
  originSiteId: integer("origin_site_id").notNull().references(() => sites.id),
  destinationSiteId: integer("destination_site_id").notNull().references(() => sites.id),
  originWarehouseId: integer("origin_warehouse_id").references(() => warehouses.id),
  destinationWarehouseId: integer("destination_warehouse_id").references(() => warehouses.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  dispatchedBy: integer("dispatched_by").references(() => users.id),
  receivedBy: integer("received_by").references(() => users.id),
  status: transferStatusEnum("status").notNull().default("DRAFT"),
  plannedDate: date("planned_date"),
  dispatchedAt: timestamp("dispatched_at"),
  receivedAt: timestamp("received_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transferItems = pgTable("transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => transfers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  requestedQuantity: decimal("requested_quantity", { precision: 12, scale: 3 }).notNull(),
  dispatchedQuantity: decimal("dispatched_quantity", { precision: 12, scale: 3 }),
  receivedQuantity: decimal("received_quantity", { precision: 12, scale: 3 }),
  lotId: integer("lot_id").references(() => lots.id),
  status: receiptStatusEnum("status"),
  incidentReason: text("incident_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Purchases ─────────────────────────────────────────────────────────────────

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  status: purchaseStatusEnum("status").notNull().default("DRAFT"),
  expectedDate: date("expected_date"),
  documentNumber: text("document_number"),
  notes: text("notes"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 4 }),
  currency: text("currency").notNull().default("PEN"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  productId: integer("product_id").notNull().references(() => products.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 4 }),
  receivedQuantity: decimal("received_quantity", { precision: 12, scale: 3 }).default("0"),
  pendingQuantity: decimal("pending_quantity", { precision: 12, scale: 3 }),
  lotNumber: text("lot_number"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Production ────────────────────────────────────────────────────────────────

export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  productionOrderNumber: text("production_order_number").notNull().unique(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  productionAreaId: integer("production_area_id").references(() => areas.id),
  plannedDate: date("planned_date").notNull(),
  shift: text("shift"),
  status: productionStatusEnum("status").notNull().default("DRAFT"),
  totalInputQuantity: decimal("total_input_quantity", { precision: 12, scale: 3 }),
  totalOutputQuantity: decimal("total_output_quantity", { precision: 12, scale: 3 }),
  wasteQuantity: decimal("waste_quantity", { precision: 12, scale: 3 }),
  yieldPercentage: decimal("yield_percentage", { precision: 5, scale: 2 }),
  createdBy: integer("created_by").notNull().references(() => users.id),
  startedBy: integer("started_by").references(() => users.id),
  completedBy: integer("completed_by").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productionInputs = pgTable("production_inputs", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").notNull().references(() => productionOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => locations.id),
  lotId: integer("lot_id").references(() => lots.id),
  plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 3 }),
  actualQuantity: decimal("actual_quantity", { precision: 12, scale: 3 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productionOutputs = pgTable("production_outputs", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").notNull().references(() => productionOrders.id),
  outputProductId: integer("output_product_id").notNull().references(() => products.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  destinationWarehouseId: integer("destination_warehouse_id").references(() => warehouses.id),
  destinationLocationId: integer("destination_location_id").references(() => locations.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  lotNumber: text("lot_number"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Waste ─────────────────────────────────────────────────────────────────────

export const wasteRecords = pgTable("waste_records", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  stage: wasteStageEnum("stage").notNull(),
  cause: text("cause").notNull(),
  areaId: integer("area_id").references(() => areas.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => locations.id),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id),
  responsibleUserId: integer("responsible_user_id").notNull().references(() => users.id),
  authorizationUserId: integer("authorization_user_id").references(() => users.id),
  consumesStock: boolean("consumes_stock").notNull().default(true),
  occurredAt: timestamp("occurred_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Budgets ───────────────────────────────────────────────────────────────────

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id").notNull().references(() => areas.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  period: text("period").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("PEN"),
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).default("80"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Notifications ─────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Audit Logs ────────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  authorizedBy: integer("authorized_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Settings ──────────────────────────────────────────────────────────────────

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").references(() => sites.id),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Sessions (simple auth) ────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ─────────────────────────────────────────────────────────────────

export const sitesRelations = relations(sites, ({ many }) => ({
  areas: many(areas),
  warehouses: many(warehouses),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  site: one(sites, { fields: [areas.siteId], references: [sites.id] }),
  productAreaAccess: many(productAreaAccess),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  site: one(sites, { fields: [warehouses.siteId], references: [sites.id] }),
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  warehouse: one(warehouses, { fields: [locations.warehouseId], references: [warehouses.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  subcategory: one(subcategories, { fields: [products.subcategoryId], references: [subcategories.id] }),
  unit: one(units, { fields: [products.unitId], references: [units.id] }),
  productAreaAccess: many(productAreaAccess),
  lots: many(lots),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  subcategories: many(subcategories),
}));

export const usersRelations = relations(users, ({ one }) => ({
  site: one(sites, { fields: [users.siteId], references: [sites.id] }),
  area: one(areas, { fields: [users.areaId], references: [areas.id] }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  site: one(sites, { fields: [requests.siteId], references: [sites.id] }),
  area: one(areas, { fields: [requests.areaId], references: [areas.id] }),
  requestedByUser: one(users, { fields: [requests.requestedBy], references: [users.id] }),
  items: many(requestItems),
  approvals: many(requestApprovals),
  dispatches: many(dispatches),
}));

export const requestItemsRelations = relations(requestItems, ({ one }) => ({
  request: one(requests, { fields: [requestItems.requestId], references: [requests.id] }),
  product: one(products, { fields: [requestItems.productId], references: [products.id] }),
  unit: one(units, { fields: [requestItems.unitId], references: [units.id] }),
}));

export const transfersRelations = relations(transfers, ({ one, many }) => ({
  originSite: one(sites, { fields: [transfers.originSiteId], references: [sites.id] }),
  destinationSite: one(sites, { fields: [transfers.destinationSiteId], references: [sites.id] }),
  items: many(transferItems),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchases.supplierId], references: [suppliers.id] }),
  site: one(sites, { fields: [purchases.siteId], references: [sites.id] }),
  items: many(purchaseItems),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  site: one(sites, { fields: [productionOrders.siteId], references: [sites.id] }),
  inputs: many(productionInputs),
  outputs: many(productionOutputs),
  wasteRecords: many(wasteRecords),
}));
