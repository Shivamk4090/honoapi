import { Context } from "hono";
import { usersService } from "../services/users.service";
import { AppContext } from "../types/context";

/**
 * Users controller — HTTP layer only.
 * Extracts params/body from request, delegates to usersService, returns JSON.
 * No business logic, no DB queries.
 */
export const usersController = {
  list: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const users = await usersService.listUsers(db);
    return c.json({ data: users });
  },

  me: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const { sub } = c.get("jwtPayload");
    const user = await usersService.getUserById(db, sub);
    return c.json({ data: user });
  },

  getById: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const id = Number(c.req.param("id"));
    const user = await usersService.getUserById(db, id);
    return c.json({ data: user });
  },

  update: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const id = Number(c.req.param("id"));
    const { sub } = c.get("jwtPayload");
    const body = await c.req.json<Partial<{ name: string; email: string }>>();

    const updated = await usersService.updateUser(db, sub, id, body);
    return c.json({ data: updated });
  },

  remove: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const id = Number(c.req.param("id"));
    const { sub } = c.get("jwtPayload");

    await usersService.deleteUser(db, sub, id);
    return c.json({ message: "Account deleted successfully" });
  },
};
