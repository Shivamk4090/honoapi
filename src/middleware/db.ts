import { MiddlewareHandler } from "hono";
import { createDb } from "../db/client";
import { Bindings } from "../types/bindings";

/**
 * Middleware that creates a Drizzle DB client from the Neon connection string
 * and attaches it to the Hono context as `c.get("db")`.
 */
export const dbMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: { db: ReturnType<typeof createDb> };
}> = async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  c.set("db", db);
  await next();
};
