import { Hono } from "hono";
import { usersController } from "../controllers/users.controller";
import { AppContext } from "../types/context";

/**
 * Users router — thin declarative wiring only.
 * All logic lives in usersController → usersService → usersRepository.
 *
 * Auth is applied at the app level (app.use "/api/*" authMiddleware).
 */
const usersRouter = new Hono<AppContext>();

usersRouter.get("/", usersController.list);
usersRouter.get("/me", usersController.me);
usersRouter.get("/:id", usersController.getById);
usersRouter.patch("/:id", usersController.update);
usersRouter.delete("/:id", usersController.remove);

export default usersRouter;
