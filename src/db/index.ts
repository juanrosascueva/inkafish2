import { newDb } from "pg-mem";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Delete getTypeParser so pg-mem does not throw 'getTypeParser is not supported'
delete (pg as any).types?.getTypeParser;

const globalForDb = globalThis as typeof globalThis & {
  __pgMemData?: {
    mem: any;
    db: any;
  };
  __dbInitPromise?: Promise<void>;
};

function createPgMemDb() {
  const mem = newDb();
  
  // Register postgres helper functions
  mem.public.registerFunction({
    name: "current_database",
    implementation: () => "app_db",
  });

  mem.public.registerFunction({
    name: "version",
    implementation: () => "PostgreSQL 14.0 (pg-mem)",
  });

  const adapter = mem.adapters.createPg();
  const pool = new adapter.Pool();
  
  // Intercept pool.query to bridge pg-mem and Drizzle ORM array rowMode + fields
  const origQuery = pool.query.bind(pool);
  pool.query = function (queryConfig: any, ...args: any[]) {
    let isArrayMode = false;
    let callback = typeof args[args.length - 1] === "function" ? args.pop() : null;

    if (typeof queryConfig === "object" && queryConfig !== null) {
      if (queryConfig.rowMode === "array") {
        isArrayMode = true;
        delete queryConfig.rowMode;
      }
      if (queryConfig.types) {
        delete queryConfig.types.getTypeParser;
      }
    }

    const handleResult = (res: any) => {
      if (res && res.rows && res.rows.length > 0) {
        const keys = Object.keys(res.rows[0]);
        const fields = keys.map((k) => ({ name: k }));
        const rows = isArrayMode
          ? res.rows.map((row: any) => keys.map((k) => row[k]))
          : res.rows;
        return { ...res, fields, rows };
      }
      return res;
    };

    if (callback) {
      return origQuery(queryConfig, ...args, (err: any, res: any) => {
        if (err) return callback(err);
        return callback(null, handleResult(res));
      });
    }

    const promise = origQuery(queryConfig, ...args);
    return promise && promise.then ? promise.then(handleResult) : promise;
  };

  const dbInstance = drizzle(pool, { schema });
  return { mem, pool, db: dbInstance };
}

const pgMem = globalForDb.__pgMemData ?? createPgMemDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgMemData = pgMem;
}

export const db = pgMem.db;

// Auto-create database tables on initialization
if (!globalForDb.__dbInitPromise) {
  globalForDb.__dbInitPromise = (async () => {
    try {
      console.log("[pg-mem] Initializing database schema...");
      const migrationPath = path.join(process.cwd(), "drizzle", "0000_complex_pestilence.sql");
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, "utf-8");
        const statements = migrationSql.split("--> statement-breakpoint");
        for (const stmt of statements) {
          const sql = stmt.trim();
          if (sql) {
            try {
              pgMem.mem.public.none(sql);
            } catch (err: any) {
              // Ignore type exists / non-critical DDL errors
              if (!err.message?.includes("already exists")) {
                console.warn("[pg-mem DDL warn]:", err.message);
              }
            }
          }
        }
        console.log("[pg-mem] Schema created successfully. Seeding initial data...");
        try {
          const { seedDatabase } = await import("@/lib/seed");
          await seedDatabase();
          console.log("[pg-mem] Seeding completed successfully.");
        } catch (seedErr) {
          console.error("[pg-mem] Seeding error:", seedErr);
        }
      }
    } catch (err) {
      console.error("[pg-mem] Error initializing tables:", err);
    }
  })();
}

export async function ensureDbReady() {
  await globalForDb.__dbInitPromise;
}


