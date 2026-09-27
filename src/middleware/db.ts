import { MiddlewareHandler } from "hono";
import { createDb } from "../db/client";
import { AppContext } from "../types/context";

/**
 * DB middleware — creates a Drizzle client per request and injects it into context.
 *
 * ─────────────────────────────────────────────────────────
 * Migrating to Node.js?
 * ─────────────────────────────────────────────────────────
 * Change:
 *   const db = createDb(c.env.DATABASE_URL);
 * To:
 *   const db = createDb(process.env.DATABASE_URL!);
 *
 * Everything downstream (repositories, services) stays unchanged.
 * ─────────────────────────────────────────────────────────
 */
export const dbMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  c.set("db", db);
  await next();
};
