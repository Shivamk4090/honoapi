import { eq } from "drizzle-orm";
import { Db } from "../db/client";
import { plans, features, planFeatures } from "../db/schema";

export const plansRepository = {
  /** All active plans, ordered for display */
  findAll: (db: Db) =>
    db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.sortOrder),

  findByCode: async (db: Db, code: string) => {
    const rows = await db.select().from(plans).where(eq(plans.code, code));
    return rows[0] ?? null;
  },

  findById: async (db: Db, id: number) => {
    const rows = await db.select().from(plans).where(eq(plans.id, id));
    return rows[0] ?? null;
  },

  /**
   * Get all features for a plan with their limits.
   * This is the core of entitlement resolution.
   */
  findFeaturesForPlan: (db: Db, planId: number) =>
    db
      .select({
        featureId: features.id,
        featureCode: features.code,
        featureName: features.name,
        limitValue: planFeatures.limitValue,
        limitPeriod: planFeatures.limitPeriod,
      })
      .from(planFeatures)
      .innerJoin(features, eq(planFeatures.featureId, features.id))
      .where(eq(planFeatures.planId, planId)),
};
