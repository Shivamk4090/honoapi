import { Bindings } from "./bindings";
import { Db } from "../db/client";
import { JwtPayload } from "../middleware/auth";

/**
 * Shared Hono context type — used across routes, controllers, middleware.
 *
 * When migrating to Node.js:
 *   - Bindings → process.env (update db.ts middleware to read from process.env)
 *   - Variables stay the same
 */
export type AppContext = {
  Bindings: Bindings;
  Variables: {
    db: Db;
    jwtPayload: JwtPayload;
    requestId: string;
  };
};
