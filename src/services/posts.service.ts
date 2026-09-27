import { Db } from "../db/client";
import { postsRepository } from "../repositories/posts.repository";
import { NotFoundError, ValidationError } from "../lib/errors";

/**
 * Posts service — pure business logic.
 * No HTTP, no Hono, no Cloudflare APIs.
 */
export const postsService = {
  listPosts: (db: Db) =>
    postsRepository.findAll(db),

  getPostById: async (db: Db, id: number) => {
    const post = await postsRepository.findById(db, id);
    if (!post) throw new NotFoundError("Post not found");
    return post;
  },

  createPost: async (
    db: Db,
    data: { title: string; content?: string; userId: number }
  ) => {
    if (!data.title?.trim()) {
      throw new ValidationError("title is required");
    }
    if (!data.userId) {
      throw new ValidationError("userId is required");
    }
    return postsRepository.create(db, {
      title: data.title.trim(),
      content: data.content ?? null,
      userId: data.userId,
    });
  },

  updatePost: async (
    db: Db,
    id: number,
    data: Partial<{ title: string; content: string }>
  ) => {
    if (!data.title?.trim() && !data.content) {
      throw new ValidationError("Provide at least title or content to update");
    }
    const updated = await postsRepository.update(db, id, data);
    if (!updated) throw new NotFoundError("Post not found");
    return updated;
  },

  deletePost: async (db: Db, id: number) => {
    const deleted = await postsRepository.delete(db, id);
    if (!deleted) throw new NotFoundError("Post not found");
    return deleted;
  },
};
