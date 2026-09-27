import { MiddlewareHandler } from "hono";

/**
 * Attaches a unique request ID to every request.
 * Exposed via the X-Request-Id response header.
 * Runtime-agnostic — uses Web Crypto (available everywhere Hono runs).
 */
export const requestId: MiddlewareHandler = async (c, next) => {
  const id = crypto.randomUUID();
  c.set("requestId" as never, id);
  c.header("X-Request-Id", id);
  await next();
};
