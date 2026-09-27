import { eq } from "drizzle-orm";
import { Db } from "../db/client";
import { posts, NewPost } from "../db/schema";

/**
 * Posts repository — only raw DB operations, no business rules.
 * Accepts a `Db` instance so it's portable across any Drizzle-compatible driver.
 */
export const postsRepository = {
  findAll: (db: Db) =>
    db.select().from(posts),

  findById: async (db: Db, id: number) => {
    const rows = await db.select().from(posts).where(eq(posts.id, id));
    return rows[0] ?? null;
  },

  create: async (db: Db, data: Pick<NewPost, "title" | "content" | "userId">) => {
    const rows = await db
      .insert(posts)
      .values(data)
      .returning();
    return rows[0]!;
  },

  update: async (db: Db, id: number, data: Partial<Pick<NewPost, "title" | "content">>) => {
    const rows = await db
      .update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return rows[0] ?? null;
  },

  delete: async (db: Db, id: number) => {
    const rows = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning({ id: posts.id });
    return rows[0] ?? null;
  },
};
