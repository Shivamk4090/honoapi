import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { posts } from "../db/schema";
import { createDb } from "../db/client";
import { Bindings } from "../types/bindings";

type Variables = { db: ReturnType<typeof createDb> };

const postsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /posts — list all posts
postsRouter.get("/", async (c) => {
  const db = c.get("db");
  const allPosts = await db.select().from(posts);
  return c.json({ data: allPosts });
});

// GET /posts/:id — get single post
postsRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));

  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return c.json({ error: "Post not found" }, 404);

  return c.json({ data: post });
});

// POST /posts — create post
postsRouter.post("/", async (c) => {
  const db = c.get("db");
  const body = await c.req.json<{
    title: string;
    content?: string;
    userId: number;
  }>();

  if (!body.title || !body.userId) {
    return c.json({ error: "title and userId are required" }, 400);
  }

  const [created] = await db
    .insert(posts)
    .values({
      title: body.title,
      content: body.content ?? null,
      userId: body.userId,
    })
    .returning();

  return c.json({ data: created }, 201);
});

// PATCH /posts/:id — update post
postsRouter.patch("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const body = await c.req.json<
    Partial<{ title: string; content: string }>
  >();

  const [updated] = await db
    .update(posts)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();

  if (!updated) return c.json({ error: "Post not found" }, 404);

  return c.json({ data: updated });
});

// DELETE /posts/:id — delete post
postsRouter.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = Number(c.req.param("id"));

  const [deleted] = await db
    .delete(posts)
    .where(eq(posts.id, id))
    .returning();

  if (!deleted) return c.json({ error: "Post not found" }, 404);

  return c.json({ message: "Post deleted" });
});

export default postsRouter;
