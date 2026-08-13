import { db } from "@/db";
import {
  sites,
  areas,
  warehouses,
  locations,
  units,
  categories,
  subcategories,
  products,
  users,
  suppliers,
} from "@/db/schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  // Sites
  await db
    .insert(sites)
    .values([
      { name: "San Miguel", code: "SM", address: "Av. Principal 123, San Miguel" },
      { name: "Lince", code: "LN", address: "Av. Arequipa 456, Lince" },
    ])
    .onConflictDoNothing();

  const siteList = await db.select().from(sites);
  const sanMiguel = siteList.find((s: any) => s.code === "SM");
  const lince = siteList.find((s: any) => s.code === "LN");

  if (!sanMiguel || !lince) return;

  // Areas
  await db
    .insert(areas)
    .values([
      { siteId: sanMiguel.id, name: "Cocina", code: "COC" },
      { siteId: sanMiguel.id, name: "Salón", code: "SAL" },
      { siteId: sanMiguel.id, name: "Bar", code: "BAR" },
      { siteId: sanMiguel.id, name: "Administración", code: "ADM" },
      { siteId: sanMiguel.id, name: "Producción", code: "PRD" },
      { siteId: lince.id, name: "Cocina", code: "COC" },
      { siteId: lince.id, name: "Salón", code: "SAL" },
      { siteId: lince.id, name: "Bar", code: "BAR" },
    ])
    .onConflictDoNothing();

  const areaList = await db.select().from(areas);
  const cocinaSm = areaList.find((a: any) => a.siteId === sanMiguel.id && a.code === "COC");
  const produccionSm = areaList.find((a: any) => a.siteId === sanMiguel.id && a.code === "PRD");
  const cocinaSmId = cocinaSm?.id;
  const produccionSmId = produccionSm?.id;

  // Warehouses
  await db
    .insert(warehouses)
    .values([
      { siteId: sanMiguel.id, name: "Almacén Principal", code: "ALM-PRIN" },
      { siteId: sanMiguel.id, name: "Almacén Abarrotes", code: "ALM-ABA" },
      { siteId: sanMiguel.id, name: "Cámara de Frío", code: "CAM-FRI" },
      { siteId: sanMiguel.id, name: "Congeladoras", code: "CONG" },
      { siteId: lince.id, name: "Almacén Abarrotes", code: "ALM-ABA" },
      { siteId: lince.id, name: "Conservadoras", code: "CONS" },
    ])
    .onConflictDoNothing();

  // Units
  await db
    .insert(units)
    .values([
      { name: "Unidad", symbol: "UND", allowsDecimals: false, decimalPrecision: 0 },
      { name: "Caja", symbol: "CJA", allowsDecimals: false, decimalPrecision: 0 },
      { name: "Bolsa", symbol: "BOL", allowsDecimals: false, decimalPrecision: 0 },
      { name: "Paquete", symbol: "PAQ", allowsDecimals: false, decimalPrecision: 0 },
      { name: "Botella", symbol: "BOT", allowsDecimals: false, decimalPrecision: 0 },
      { name: "Kilogramo", symbol: "KG", allowsDecimals: true, decimalPrecision: 3 },
      { name: "Gramo", symbol: "GR", allowsDecimals: true, decimalPrecision: 1 },
      { name: "Litro", symbol: "LT", allowsDecimals: true, decimalPrecision: 3 },
      { name: "Mililitro", symbol: "ML", allowsDecimals: true, decimalPrecision: 1 },
      { name: "Docena", symbol: "DOC", allowsDecimals: false, decimalPrecision: 0 },
    ])
    .onConflictDoNothing();

  // Categories
  const cats = await db
    .insert(categories)
    .values([
      { name: "Abarrotes", code: "ABA" },
      { name: "Proteínas", code: "PRO" },
      { name: "Carnes", code: "CAR" },
      { name: "Suministros", code: "SUM" },
      { name: "Artículos de Oficina", code: "OFI" },
      { name: "Limpieza", code: "LIM" },
      { name: "Bebidas", code: "BEB" },
      { name: "Descartables", code: "DES" },
      { name: "Verduras", code: "VER" },
      { name: "Frutas", code: "FRU" },
      { name: "Gas", code: "GAS" },
    ])
    .onConflictDoNothing();

  // Products
  const unitRows = await db.select().from(units);
  const unitMap: Record<string, number> = {};
  unitRows.forEach((u: any) => { unitMap[u.symbol] = u.id; });

  const catRows = await db.select().from(categories);
  const catMap: Record<string, number> = {};
  catRows.forEach((c: any) => { catMap[c.code] = c.id; });

  if (catMap["ABA"] && unitMap["KG"]) {
    await db
      .insert(products)
      .values([
        { code: "P-000001", name: "Arroz Extra", categoryId: catMap["ABA"], unitId: unitMap["KG"], tracksLot: false, tracksExpiry: false },
        { code: "P-000002", name: "Aceite Vegetal", categoryId: catMap["ABA"], unitId: unitMap["LT"] ?? unitMap["KG"], tracksLot: false, tracksExpiry: false },
        { code: "P-000003", name: "Azúcar Blanca", categoryId: catMap["ABA"], unitId: unitMap["KG"], tracksLot: false, tracksExpiry: false },
        { code: "P-000004", name: "Sal de Mesa", categoryId: catMap["ABA"], unitId: unitMap["KG"], tracksLot: false, tracksExpiry: false },
        { code: "P-000005", name: "Pollo Entero", categoryId: catMap["PRO"] ?? catMap["ABA"], unitId: unitMap["KG"], tracksLot: true, tracksExpiry: true },
        { code: "P-000006", name: "Carne de Res", categoryId: catMap["CAR"] ?? catMap["ABA"], unitId: unitMap["KG"], tracksLot: true, tracksExpiry: true },
        { code: "P-000007", name: "Lechuga", categoryId: catMap["VER"] ?? catMap["ABA"], unitId: unitMap["UND"] ?? unitMap["KG"], tracksLot: false, tracksExpiry: true },
        { code: "P-000008", name: "Tomate", categoryId: catMap["VER"] ?? catMap["ABA"], unitId: unitMap["KG"], tracksLot: false, tracksExpiry: true },
        { code: "P-000009", name: "Detergente Industrial", categoryId: catMap["LIM"] ?? catMap["ABA"], unitId: unitMap["KG"], tracksLot: false, tracksExpiry: false },
        { code: "P-000010", name: "Agua Mineral", categoryId: catMap["BEB"] ?? catMap["ABA"], unitId: unitMap["BOT"] ?? unitMap["UND"], tracksLot: false, tracksExpiry: true },
      ])
      .onConflictDoNothing();
  }

  // Users
  const password = await bcrypt.hash("admin123", 12);
  await db
    .insert(users)
    .values([
      { email: "gerencia@sistema.com", name: "Juan Vila", password, role: "GERENCIA", siteId: sanMiguel.id },
      { email: "admin@sistema.com", name: "Admin Sistema", password, role: "ADMINISTRACION", siteId: sanMiguel.id },
      { email: "chef@sistema.com", name: "Chef Ejecutiva", password, role: "CHEF_EJECUTIVA", siteId: sanMiguel.id },
      { email: "almacen@sistema.com", name: "Encargado Almacén", password, role: "ALMACEN", siteId: sanMiguel.id },
      { email: "cocina@sistema.com", name: "Jefe Cocina", password, role: "JEFE_COCINA", siteId: sanMiguel.id },
      { email: "salon@sistema.com", name: "Jefe Salón", password, role: "JEFE_SALON", siteId: sanMiguel.id },
      { email: "bar@sistema.com", name: "Jefe Bar", password, role: "JEFE_BAR", siteId: sanMiguel.id },
      { email: "solicitante@sistema.com", name: "Solicitante Demo", password, role: "SOLICITANTE", siteId: sanMiguel.id, areaId: cocinaSmId ?? null },
      { email: "produccion@sistema.com", name: "Encargado Producción", password, role: "PRODUCCION", siteId: sanMiguel.id, areaId: produccionSmId ?? null },
    ])
    .onConflictDoNothing();

  // Suppliers
  await db
    .insert(suppliers)
    .values([
      { name: "Proveedora Central SAC", documentNumber: "20123456789", contactName: "Carlos Pérez", phone: "999888777", email: "ventas@provcentral.com" },
      { name: "Frigorífico del Sur EIRL", documentNumber: "20987654321", contactName: "María López", phone: "988777666", email: "pedidos@frigosur.com" },
      { name: "Distribuidora Lima Norte", documentNumber: "20456789012", contactName: "Pedro García", phone: "977666555" },
    ])
    .onConflictDoNothing();
}
