import { Hono } from "hono";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { AppContext } from "../types/context";

const authRouter = new Hono<AppContext>();

// Public
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);

// Protected
authRouter.get("/me", authMiddleware, authController.me);

export default authRouter;
