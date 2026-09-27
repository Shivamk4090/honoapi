import { Db } from "../db/client";
import { usersRepository } from "../repositories/users.repository";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { ConflictError, UnauthorizedError, ValidationError } from "../lib/errors";

/**
 * Auth service — pure business logic.
 * No HTTP, no Hono, no Cloudflare APIs.
 *
 * JWT signing is intentionally NOT here — that's an HTTP-layer concern (controller).
 * This service returns user data; the controller signs the token.
 */
export const authService = {
  register: async (
    db: Db,
    data: { name: string; email: string; password: string }
  ) => {
    if (!data.name?.trim() || !data.email?.trim() || !data.password) {
      throw new ValidationError("name, email and password are required");
    }
    if (data.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    const existing = await usersRepository.findByEmail(db, data.email);
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await hashPassword(data.password);

    return usersRepository.create(db, {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash,
    });
  },

  login: async (db: Db, data: { email: string; password: string }) => {
    if (!data.email?.trim() || !data.password) {
      throw new ValidationError("email and password are required");
    }

    const user = await usersRepository.findByEmail(db, data.email.trim().toLowerCase());
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    return { id: user.id, name: user.name, email: user.email };
  },
};
