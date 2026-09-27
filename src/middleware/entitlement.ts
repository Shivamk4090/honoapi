import { MiddlewareHandler } from "hono";
import { entitlementService, Entitlement } from "../services/entitlement.service";
import { AppContext } from "../types/context";

/**
 * Entitlement middleware factory.
 *
 * Usage — add to any route that requires a feature check:
 *
 *   app.post(
 *     "/api/images/generate",
 *     authMiddleware,
 *     checkEntitlement("image_generation"),
 *     imageController.generate
 *   );
 *
 * On success: injects `entitlement` into context for downstream use.
 * On failure: throws UsageLimitError (429) or PlanFeatureError (403).
 *
 * After your business logic succeeds, increment usage:
 *
 *   const entitlement = c.get("entitlement");
 *   await entitlementService.trackUsage(db, userId, entitlement.featureCode, entitlement.limitPeriod);
 */
export function checkEntitlement(featureCode: string): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const db = c.get("db");
    const { sub: userId } = c.get("jwtPayload");

    const entitlement = await entitlementService.checkAccess(db, userId, featureCode);

    // Inject for downstream controller use
    c.set("entitlement", entitlement as never);

    await next();
  };
}
