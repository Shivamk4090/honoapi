import { Hono } from "hono";
import { postsController } from "../controllers/posts.controller";
import { AppContext } from "../types/context";

/**
 * Posts router — thin declarative wiring only.
 * Auth is applied at the app level (app.use "/api/*" authMiddleware).
 */
const postsRouter = new Hono<AppContext>();

postsRouter.get("/", postsController.list);
postsRouter.get("/:id", postsController.getById);
postsRouter.post("/", postsController.create);
postsRouter.patch("/:id", postsController.update);
postsRouter.delete("/:id", postsController.remove);

export default postsRouter;
