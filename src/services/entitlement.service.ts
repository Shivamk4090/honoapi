import { Db } from "../db/client";
import { plansRepository } from "../repositories/plans.repository";
import { subscriptionsRepository } from "../repositories/subscriptions.repository";
import { usageRepository, getCurrentPeriod } from "../repositories/usage.repository";
import { PlanFeatureError, UnauthorizedError, UsageLimitError } from "../lib/errors";

/**
 * Resolved entitlement — what a user can do with a specific feature.
 */
export type Entitlement = {
  userId: number;
  planCode: string;
  featureCode: string;
  limitValue: number;     // -1 = unlimited
  limitPeriod: string;
  currentUsage: number;
  allowed: boolean;
};

// ── In-process TTL cache (per isolate) ────────────────────────────────────────
// For production multi-region CF Workers: swap with KV binding
//
//   const cached = await c.env.ENTITLEMENT_KV.get(cacheKey, "json");
//   await c.env.ENTITLEMENT_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
//
const cache = new Map<string, { data: Entitlement; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export const entitlementService = {
  /**
   * Core entitlement check — answers: "Can user X use feature Y right now?"
   *
   * Flow:
   *   1. Get user's active subscription + plan
   *   2. Get plan's feature limits (with cache)
   *   3. Compare current usage vs limit
   *   4. Return Entitlement or throw UsageLimitError / PlanFeatureError
   */
  checkAccess: async (
    db: Db,
    userId: number,
    featureCode: string
  ): Promise<Entitlement> => {
    const cacheKey = `ent:${userId}:${featureCode}`;

    // Cache HIT
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      // Re-check usage even on cache hit (usage must always be fresh)
      const sub = cached.data;
      const period = getCurrentPeriod(sub.limitPeriod);
      const currentUsage = await usageRepository.getUsage(db, userId, featureCode, period);
      const entitlement = { ...sub, currentUsage, allowed: sub.limitValue === -1 || currentUsage < sub.limitValue };

      if (sub.limitValue !== -1 && currentUsage >= sub.limitValue) {
        throw new UsageLimitError(featureCode, sub.limitValue, currentUsage);
      }
      return entitlement;
    }

    // Cache MISS — fetch from Neon
    const subscription = await subscriptionsRepository.findActiveByUserId(db, userId);
    if (!subscription) throw new UnauthorizedError("No active subscription found");

    const planFeatureList = await plansRepository.findFeaturesForPlan(db, subscription.planId);
    const feature = planFeatureList.find((f) => f.featureCode === featureCode);

    // Feature not in plan at all
    if (!feature) throw new PlanFeatureError(featureCode);

    // Feature explicitly disabled (limit = 0)
    if (feature.limitValue === 0) throw new PlanFeatureError(featureCode);

    const period = getCurrentPeriod(feature.limitPeriod);
    const currentUsage = await usageRepository.getUsage(db, userId, featureCode, period);

    const entitlement: Entitlement = {
      userId,
      planCode: subscription.planCode,
      featureCode,
      limitValue: feature.limitValue,
      limitPeriod: feature.limitPeriod,
      currentUsage,
      allowed: feature.limitValue === -1 || currentUsage < feature.limitValue,
    };

    // Cache plan/feature metadata (NOT usage — usage is always re-fetched)
    cache.set(cacheKey, {
      data: { ...entitlement, currentUsage: 0 }, // store without usage
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Hard limit check
    if (feature.limitValue !== -1 && currentUsage >= feature.limitValue) {
      throw new UsageLimitError(featureCode, feature.limitValue, currentUsage);
    }

    return entitlement;
  },

  /**
   * Increment usage after a successful operation.
   * Call this AFTER your business logic succeeds, not before.
   */
  trackUsage: async (db: Db, userId: number, featureCode: string, limitPeriod = "monthly") => {
    const period = getCurrentPeriod(limitPeriod);
    return usageRepository.increment(db, userId, featureCode, period);
  },

  /**
   * Get current month's usage summary for dashboard display.
   */
  getUsageSummary: (db: Db, userId: number) => {
    const period = getCurrentPeriod("monthly");
    return usageRepository.getSummary(db, userId, period);
  },

  /**
   * Invalidate cached entitlement for a user (call after plan upgrade/downgrade).
   */
  invalidateCache: (userId: number) => {
    for (const key of cache.keys()) {
      if (key.startsWith(`ent:${userId}:`)) cache.delete(key);
    }
  },
};
