import { Hono } from "hono";
import { plansController } from "../controllers/plans.controller";
import { AppContext } from "../types/context";

/**
 * Public plans route — no auth required.
 * Used for pricing page.
 */
const plansRouter = new Hono<AppContext>();

plansRouter.get("/", plansController.list);

export default plansRouter;
