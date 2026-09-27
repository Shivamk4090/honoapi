import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { AppContext } from "./types/context";
import { corsMiddleware } from "./middleware/cors";
import { dbMiddleware } from "./middleware/db";
import { authMiddleware } from "./middleware/auth";
import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";
import plansRouter from "./routes/plans";
import subscriptionsRouter from "./routes/subscriptions";

/**
 * Hono application — runtime-agnostic.
 * Zero Cloudflare-specific code here.
 *
 * Cloudflare entry:  src/index.ts  → export default app
 * Node.js entry:     src/server.ts → serve({ fetch: app.fetch, port: 3000 })
 */
const app = new Hono<AppContext>();

// ── Global middleware ────────────────────────────────────────────────────────
app.use("*", requestId);
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", corsMiddleware);
app.use("*", dbMiddleware);

// ── Public routes ─────────────────────────────────────────────────────────────
app.get("/", (c) =>
  c.json({
    status: "ok",
    message: "🔥 honoapi is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

// Auth (register/login — public)
app.route("/auth", authRouter);

// Plans (pricing page — public)
app.route("/plans", plansRouter);

// ── Protected routes (JWT required) ──────────────────────────────────────────
app.use("/api/*", authMiddleware);

// User & post CRUD
app.route("/api/users", usersRouter);
app.route("/api/posts", postsRouter);

// Subscription management
app.route("/api/subscriptions", subscriptionsRouter);

// ── 404 + global error handler ───────────────────────────────────────────────
app.notFound((c) =>
  c.json({ error: `Route ${c.req.method} ${c.req.path} not found` }, 404)
);

app.onError(errorHandler);

export default app;
