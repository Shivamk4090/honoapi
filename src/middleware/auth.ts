import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { AppContext } from "../types/context";

export type JwtPayload = {
  sub: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

/**
 * JWT auth middleware — validates Bearer token and injects payload into context.
 *
 * ─────────────────────────────────────────────────────────
 * Migrating to Node.js?
 * ─────────────────────────────────────────────────────────
 * Change:
 *   c.env.JWT_SECRET
 * To:
 *   process.env.JWT_SECRET!
 *
 * Everything else stays the same.
 * ─────────────────────────────────────────────────────────
 */
export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = (await verify(token, c.env.JWT_SECRET, "HS256")) as JwtPayload;
    c.set("jwtPayload", payload);
    await next();
  } catch {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }
};
