import { Context } from "hono";
import { sign } from "hono/jwt";
import { authService } from "../services/auth.service";
import { AppContext } from "../types/context";

/**
 * Auth controller — HTTP layer only.
 * Reads req body, calls service, signs JWT, returns JSON.
 *
 * JWT signing lives here (not in service) because it's an HTTP-transport concern.
 * When migrating to Node.js, only JWT_SECRET source changes (process.env vs c.env).
 */
export const authController = {
  register: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const body = await c.req.json<{ name: string; email: string; password: string }>();

    const user = await authService.register(db, body);
    const token = await createToken(c, user);

    return c.json({ message: "Registered successfully", token, user }, 201);
  },

  login: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const body = await c.req.json<{ email: string; password: string }>();

    const user = await authService.login(db, body);
    const token = await createToken(c, user);

    return c.json({ message: "Login successful", token, user });
  },

  me: (c: Context<AppContext>) => {
    const { sub, name, email } = c.get("jwtPayload");
    return c.json({ user: { id: sub, name, email } });
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createToken(
  c: Context<AppContext>,
  user: { id: number; name: string; email: string }
) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: user.id, email: user.email, name: user.name, iat: now, exp: now + 60 * 60 * 24 * 7 },
    c.env.JWT_SECRET,
    "HS256"
  );
}
