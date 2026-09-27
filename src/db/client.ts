import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Create a Drizzle ORM client connected to Neon via HTTP.
 *
 * ─────────────────────────────────────────────────────────
 * Migrating to Node.js / Bun / Docker?
 * ─────────────────────────────────────────────────────────
 * Swap the driver:
 *
 *   import { drizzle } from "drizzle-orm/node-postgres";
 *   import { Pool } from "pg";
 *
 *   const pool = new Pool({ connectionString: DATABASE_URL });
 *   return drizzle(pool, { schema });
 *
 * Repositories and services stay completely unchanged.
 * ─────────────────────────────────────────────────────────
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
