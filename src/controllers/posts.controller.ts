import { Context } from "hono";
import { postsService } from "../services/posts.service";
import { AppContext } from "../types/context";

/**
 * Posts controller — HTTP layer only.
 * Extracts params/body from request, delegates to postsService, returns JSON.
 */
export const postsController = {
  list: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const posts = await postsService.listPosts(db);
    return c.json({ data: posts });
  },

  getById: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const id = Number(c.req.param("id"));
    const post = await postsService.getPostById(db, id);
    return c.json({ data: post });
  },

  create: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const body = await c.req.json<{ title: string; content?: string; userId: number }>();
    const created = await postsService.createPost(db, body);
    return c.json({ data: created }, 201);
  },

  update: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const id = Number(c.req.param("id"));
    const body = await c.req.json<Partial<{ title: string; content: string }>>();
    const updated = await postsService.updatePost(db, id, body);
    return c.json({ data: updated });
  },

  remove: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const id = Number(c.req.param("id"));
    await postsService.deletePost(db, id);
    return c.json({ message: "Post deleted successfully" });
  },
};
