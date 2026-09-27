import { Context } from "hono";
import { subscriptionService } from "../services/subscription.service";
import { entitlementService } from "../services/entitlement.service";
import { AppContext } from "../types/context";

export const plansController = {
  /** GET /plans — public pricing page data */
  list: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const plans = await subscriptionService.listPlans(db);
    return c.json({ data: plans });
  },

  /** GET /api/subscriptions/me — my current plan */
  getMySub: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const subscription = await subscriptionService.getMySubscription(db, userId);
    return c.json({ data: subscription });
  },

  /** GET /api/subscriptions/usage — my current period usage */
  getMyUsage: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const usageSummary = await entitlementService.getUsageSummary(db, userId);
    return c.json({ data: usageSummary });
  },

  /** POST /api/subscriptions/change-plan — upgrade/downgrade */
  changePlan: async (c: Context<AppContext>) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");
    const { planCode } = await c.req.json<{ planCode: string }>();

    const updated = await subscriptionService.changePlan(db, userId, planCode);

    // Invalidate entitlement cache so new plan takes effect immediately
    entitlementService.invalidateCache(userId);

    return c.json({ data: updated, message: `Plan changed to ${planCode}` });
  },
};
