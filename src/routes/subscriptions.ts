import { Hono } from "hono";
import { plansController } from "../controllers/plans.controller";
import { AppContext } from "../types/context";

/**
 * Protected subscription routes — all require auth (applied at app level).
 */
const subscriptionsRouter = new Hono<AppContext>();

subscriptionsRouter.get("/me", plansController.getMySub);
subscriptionsRouter.get("/usage", plansController.getMyUsage);
subscriptionsRouter.post("/change-plan", plansController.changePlan);

export default subscriptionsRouter;
