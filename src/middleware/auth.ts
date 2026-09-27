import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { Bindings } from "../types/bindings";

export type JwtPayload = {
  sub: number;   // user id
  email: string;
  name: string;
  iat: number;
  exp: number;
};

type Variables = { jwtPayload: JwtPayload };

/**
 * JWT auth middleware.
 * Reads the Bearer token from the Authorization header,
 * verifies it using JWT_SECRET, and injects payload into context.
 *
 * Usage: app.use("/api/*", authMiddleware)
 */
export const authMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256") as JwtPayload;
    c.set("jwtPayload", payload);
    await next();
  } catch {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }
};
