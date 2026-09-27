/**
 * Cloudflare Worker entry point — runtime adapter only.
 *
 * This is the ONLY file that is Cloudflare-specific.
 * It simply imports the runtime-agnostic Hono app and exports it.
 *
 * ─────────────────────────────────────────────────────────
 * Migrating to Node.js / Bun / Docker?
 * ─────────────────────────────────────────────────────────
 * Create a new entry file (e.g. server.ts):
 *
 *   import { serve } from "@hono/node-server";
 *   import app from "./app";
 *
 *   serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 });
 *
 * Then update db.ts middleware to read DATABASE_URL from process.env
 * and update auth.ts middleware to read JWT_SECRET from process.env.
 * Everything else (app, routes, controllers, services, repos) stays unchanged.
 * ─────────────────────────────────────────────────────────
 */
import app from "./app";

export default app;
