import { eq } from "drizzle-orm";
import { Db } from "../db/client";
import { users, NewUser } from "../db/schema";

/**
 * Safe fields to SELECT — never expose passwordHash to callers.
 */
export const safeUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

/**
 * Users repository — only raw DB operations, no business rules.
 * Accepts a `Db` instance so it's portable across any Drizzle-compatible driver.
 *
 * Migration: swap Neon driver → pg/postgres.js in client.ts — this file stays unchanged.
 */
export const usersRepository = {
  findAll: (db: Db) =>
    db.select(safeUserFields).from(users),

  findById: async (db: Db, id: number) => {
    const rows = await db.select(safeUserFields).from(users).where(eq(users.id, id));
    return rows[0] ?? null;
  },

  findByEmail: async (db: Db, email: string) => {
    // Returns full row including passwordHash (for auth only)
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0] ?? null;
  },

  create: async (db: Db, data: Pick<NewUser, "name" | "email" | "passwordHash">) => {
    const rows = await db
      .insert(users)
      .values(data)
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });
    return rows[0]!;
  },

  update: async (db: Db, id: number, data: Partial<Pick<NewUser, "name" | "email">>) => {
    const rows = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        updatedAt: users.updatedAt,
      });
    return rows[0] ?? null;
  },

  delete: async (db: Db, id: number) => {
    const rows = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return rows[0] ?? null;
  },
};
