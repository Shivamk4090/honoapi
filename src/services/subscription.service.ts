import { Db } from "../db/client";
import { plansRepository } from "../repositories/plans.repository";
import { subscriptionsRepository } from "../repositories/subscriptions.repository";
import { NotFoundError } from "../lib/errors";

export const subscriptionService = {
  /**
   * Get all active plans (for pricing page).
   */
  listPlans: (db: Db) => plansRepository.findAll(db),

  /**
   * Get a user's current subscription with plan info.
   */
  getMySubscription: async (db: Db, userId: number) => {
    const sub = await subscriptionsRepository.findByUserId(db, userId);
    if (!sub) throw new NotFoundError("No subscription found");
    return sub;
  },

  /**
   * Assign FREE plan to a newly registered user.
   * Called automatically from authService.register.
   */
  assignFreePlan: async (db: Db, userId: number) => {
    const freePlan = await plansRepository.findByCode(db, "FREE");
    if (!freePlan) throw new NotFoundError("FREE plan not configured");

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return subscriptionsRepository.create(db, {
      userId,
      planId: freePlan.id,
      status: "active",
      provider: "manual",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });
  },

  /**
   * Upgrade/downgrade user to a different plan.
   * In production: trigger after Stripe/Paddle webhook confirms payment.
   */
  changePlan: async (db: Db, userId: number, planCode: string) => {
    const plan = await plansRepository.findByCode(db, planCode);
    if (!plan) throw new NotFoundError(`Plan "${planCode}" not found`);

    const updated = await subscriptionsRepository.upgradePlan(db, userId, plan.id);
    if (!updated) throw new NotFoundError("No subscription found to upgrade");

    return updated;
  },
};
