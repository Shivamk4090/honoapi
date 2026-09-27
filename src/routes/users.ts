import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { createDb } from "../db/client";
import { Bindings } from "../types/bindings";

type Variables = { db: ReturnType<typeof createDb> };

// Safe user fields to return (never expose passwordHash)
const safeUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

const usersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /users — list all users
usersRouter.get("/", async (c) => {
  const db = c.get("db");
  const allUsers = await db.select(safeUserFields).from(users);
  return c.json({ data: allUsers });
});

// GET /users/:id — get single user
usersRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));

  const [user] = await db.select(safeUserFields).from(users).where(eq(users.id, id));
  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({ data: user });
});

// POST /users — create user
usersRouter.post("/", async (c) => {
  const db = c.get("db");
  const body = await c.req.json<{ name: string; email: string }>();

  if (!body.name || !body.email) {
    return c.json({ error: "name and email are required" }, 400);
  }

  const [created] = await db
    .insert(users)
    .values({ name: body.name, email: body.email })
    .returning();

  return c.json({ data: created }, 201);
});

// PATCH /users/:id — update user
usersRouter.patch("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Partial<{ name: string; email: string }>>();

  const [updated] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) return c.json({ error: "User not found" }, 404);

  return c.json({ data: updated });
});

// DELETE /users/:id — delete user
usersRouter.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (!deleted) return c.json({ error: "User not found" }, 404);

  return c.json({ message: "User deleted" });
});

export default usersRouter;
