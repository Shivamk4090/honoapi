import { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";

/**
 * CORS middleware — adjust origins, methods and headers as needed.
 */
export const corsMiddleware: MiddlewareHandler = cors({
  origin: ["*"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
  credentials: false,
});
