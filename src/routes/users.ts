import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { createDb } from "../db/client";
import { Bindings } from "../types/bindings";
import { JwtPayload } from "../middleware/auth";

type Variables = {
  db: ReturnType<typeof createDb>;
  jwtPayload: JwtPayload;
};

// Safe user fields to return (never expose passwordHash)
const safeUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

const usersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ── GET /users — list all users (any authenticated user) ─────────────────────
usersRouter.get("/", async (c) => {
  const db = c.get("db");
  const allUsers = await db.select(safeUserFields).from(users);
  return c.json({ data: allUsers });
});

// ── GET /users/me — get own profile from JWT ──────────────────────────────────
usersRouter.get("/me", async (c) => {
  const db = c.get("db");
  const { sub } = c.get("jwtPayload");

  const [user] = await db
    .select(safeUserFields)
    .from(users)
    .where(eq(users.id, sub));

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({ data: user });
});

// ── GET /users/:id — get any user by id (any authenticated user) ──────────────
usersRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));

  const [user] = await db
    .select(safeUserFields)
    .from(users)
    .where(eq(users.id, id));

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({ data: user });
});

// ── PATCH /users/:id — update user (🔒 own account only) ─────────────────────
usersRouter.patch("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const { sub } = c.get("jwtPayload");

  // Authorization: can only edit your own account
  if (sub !== id) {
    return c.json({ error: "Forbidden: You can only update your own account" }, 403);
  }

  const body = await c.req.json<Partial<{ name: string; email: string }>>();

  if (!body.name && !body.email) {
    return c.json({ error: "Provide at least name or email to update" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      updatedAt: users.updatedAt,
    });

  if (!updated) return c.json({ error: "User not found" }, 404);

  return c.json({ data: updated });
});

// ── DELETE /users/:id — delete user (🔒 own account only) ────────────────────
usersRouter.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const { sub } = c.get("jwtPayload");

  // Authorization: can only delete your own account
  if (sub !== id) {
    return c.json({ error: "Forbidden: You can only delete your own account" }, 403);
  }

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!deleted) return c.json({ error: "User not found" }, 404);

  return c.json({ message: "Account deleted successfully" });
});

export default usersRouter;
