import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { createDb } from "../db/client";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { Bindings } from "../types/bindings";
import { authMiddleware, JwtPayload } from "../middleware/auth";

type Variables = { db: ReturnType<typeof createDb>; jwtPayload: JwtPayload };

const authRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ── POST /auth/register ───────────────────────────────────────────────────────
authRouter.post("/register", async (c) => {
  const db = c.get("db");
  const body = await c.req.json<{
    name: string;
    email: string;
    password: string;
  }>();

  if (!body.name || !body.email || !body.password) {
    return c.json({ error: "name, email and password are required" }, 400);
  }

  if (body.password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email));

  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  // Hash password & create user
  const passwordHash = await hashPassword(body.password);

  const [user] = await db
    .insert(users)
    .values({ name: body.name, email: body.email, passwordHash })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    });

  // Sign JWT
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user!.id,
    email: user!.email,
    name: user!.name,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  };

  const token = await sign(payload, c.env.JWT_SECRET);

  return c.json(
    {
      message: "Registered successfully",
      token,
      user: { id: user!.id, name: user!.name, email: user!.email },
    },
    201
  );
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
authRouter.post("/login", async (c) => {
  const db = c.get("db");
  const body = await c.req.json<{ email: string; password: string }>();

  if (!body.email || !body.password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email));

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Verify password
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Sign JWT
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  };

  const token = await sign(payload, c.env.JWT_SECRET);

  return c.json({
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// ── GET /auth/me (protected) ──────────────────────────────────────────────────
authRouter.get("/me", authMiddleware, async (c) => {
  const payload = c.get("jwtPayload");

  return c.json({
    user: { id: payload.sub, name: payload.name, email: payload.email },
  });
});

export default authRouter;
