import { mutation } from "./_generated/server";
import bcrypt from "bcryptjs";

export const run = mutation({
  handler: async (ctx: any) => {
    const existingSites = await ctx.db.query("sites").collect();
    if (existingSites.length > 0) return { status: "already_seeded" };

    const now = Date.now();

    // Sites
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

    // Areas
    const cocinaSmId = await ctx.db.insert("areas", {
      siteId: sanMiguelId,
      name: "Cocina",
      code: "COC",
      active: true,
      createdAt: now,
    });
    await ctx.db.insert("areas", {
      siteId: sanMiguelId,
      name: "Salón",
      code: "SAL",
      active: true,
      createdAt: now,
    });
    await ctx.db.insert("areas", {
      siteId: sanMiguelId,
      name: "Bar",
      code: "BAR",
      active: true,
      createdAt: now,
    });
    await ctx.db.insert("areas", {
      siteId: sanMiguelId,
      name: "Administración",
      code: "ADM",
      active: true,
      createdAt: now,
    });
    const produccionSmId = await ctx.db.insert("areas", {
      siteId: sanMiguelId,
      name: "Producción",
      code: "PRD",
      active: true,
      createdAt: now,
    });

    // Units
    const kgUnitId = await ctx.db.insert("units", {
      name: "Kilogramo",
      symbol: "KG",
      allowsDecimals: true,
      decimalPrecision: 3,
      active: true,
      createdAt: now,
    });
    const ltUnitId = await ctx.db.insert("units", {
      name: "Litro",
      symbol: "LT",
      allowsDecimals: true,
      decimalPrecision: 3,
      active: true,
      createdAt: now,
    });
    const undUnitId = await ctx.db.insert("units", {
      name: "Unidad",
      symbol: "UND",
      allowsDecimals: false,
      decimalPrecision: 0,
      active: true,
      createdAt: now,
    });

    // Categories
    const abaCatId = await ctx.db.insert("categories", {
      name: "Abarrotes",
      code: "ABA",
      active: true,
      createdAt: now,
    });
    const proCatId = await ctx.db.insert("categories", {
      name: "Proteínas",
      code: "PRO",
      active: true,
      createdAt: now,
    });

    // Products
    await ctx.db.insert("products", {
      code: "P-000001",
      name: "Arroz Extra",
      categoryId: abaCatId,
      unitId: kgUnitId,
      tracksLot: false,
      tracksExpiry: false,
      allowsSubstitution: true,
      minStock: 10,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("products", {
      code: "P-000002",
      name: "Aceite Vegetal",
      categoryId: abaCatId,
      unitId: ltUnitId,
      tracksLot: false,
      tracksExpiry: false,
      allowsSubstitution: true,
      minStock: 5,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("products", {
      code: "P-000005",
      name: "Pollo Entero",
      categoryId: proCatId,
      unitId: kgUnitId,
      tracksLot: true,
      tracksExpiry: true,
      allowsSubstitution: true,
      minStock: 20,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Users (password: admin123)
    const password = bcrypt.hashSync("admin123", 10);
    await ctx.db.insert("users", {
      email: "gerencia@sistema.com",
      name: "Juan Vila",
      password,
      role: "GERENCIA",
      siteId: sanMiguelId,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("users", {
      email: "admin@sistema.com",
      name: "Admin Sistema",
      password,
      role: "ADMINISTRACION",
      siteId: sanMiguelId,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("users", {
      email: "chef@sistema.com",
      name: "Chef Ejecutiva",
      password,
      role: "CHEF_EJECUTIVA",
      siteId: sanMiguelId,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("users", {
      email: "almacen@sistema.com",
      name: "Encargado Almacén",
      password,
      role: "ALMACEN",
      siteId: sanMiguelId,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("users", {
      email: "solicitante@sistema.com",
      name: "Solicitante Demo",
      password,
      role: "SOLICITANTE",
      siteId: sanMiguelId,
      areaId: cocinaSmId,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return { status: "seeded" };
  },
});
