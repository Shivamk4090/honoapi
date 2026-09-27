import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { Bindings } from "./types/bindings";
import { createDb } from "./db/client";
import { corsMiddleware } from "./middleware/cors";
import { dbMiddleware } from "./middleware/db";
import { authMiddleware, JwtPayload } from "./middleware/auth";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";

type Variables = {
  db: ReturnType<typeof createDb>;
  jwtPayload: JwtPayload;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ── Global middleware ────────────────────────────────────────────────────────
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", corsMiddleware);
app.use("*", dbMiddleware);

// ── Health check (public) ─────────────────────────────────────────────────────
app.get("/", (c) =>
  c.json({
    status: "ok",
    message: "🔥 honoapi is running",
    timestamp: new Date().toISOString(),
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

// ── Public auth routes (register & login) ─────────────────────────────────────
app.route("/auth", authRouter);

// ── Protected API routes ──────────────────────────────────────────────────────
// authMiddleware must be registered BEFORE the route handlers
app.use("/api/*", authMiddleware);
app.route("/api/users", usersRouter);
app.route("/api/posts", postsRouter);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Route not found" }, 404));

// ── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

export default app;
