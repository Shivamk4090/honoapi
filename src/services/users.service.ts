import { Db } from "../db/client";
import { usersRepository } from "../repositories/users.repository";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";

/**
 * Users service — pure business logic.
 * No HTTP, no Hono, no Cloudflare APIs.
 *
 * Migration: this file doesn't change when moving from Cloudflare → Node.js.
 */
export const usersService = {
  listUsers: (db: Db) =>
    usersRepository.findAll(db),

  getUserById: async (db: Db, id: number) => {
    const user = await usersRepository.findById(db, id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  },

  updateUser: async (
    db: Db,
    actorId: number,
    targetId: number,
    data: Partial<{ name: string; email: string }>
  ) => {
    if (actorId !== targetId) {
      throw new ForbiddenError("You can only update your own account");
    }
    if (!data.name?.trim() && !data.email?.trim()) {
      throw new ValidationError("Provide at least name or email to update");
    }

    const updated = await usersRepository.update(db, targetId, {
      ...(data.name && { name: data.name.trim() }),
      ...(data.email && { email: data.email.trim().toLowerCase() }),
    });
    if (!updated) throw new NotFoundError("User not found");
    return updated;
  },

  deleteUser: async (db: Db, actorId: number, targetId: number) => {
    if (actorId !== targetId) {
      throw new ForbiddenError("You can only delete your own account");
    }
    const deleted = await usersRepository.delete(db, targetId);
    if (!deleted) throw new NotFoundError("User not found");
    return deleted;
  },
};
