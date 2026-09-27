import { and, eq } from "drizzle-orm";
import { Db } from "../db/client";
import { subscriptions, plans, NewSubscription } from "../db/schema";

export const subscriptionsRepository = {
  /**
   * Get the user's active subscription with plan details.
   * This is called on every protected request via entitlement middleware.
   */
  findActiveByUserId: async (db: Db, userId: number) => {
    const rows = await db
      .select({
        subscriptionId: subscriptions.id,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        planId: plans.id,
        planCode: plans.code,
        planName: plans.name,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    return rows[0] ?? null;
  },

  findByUserId: async (db: Db, userId: number) => {
    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return rows[0] ?? null;
  },

  create: async (db: Db, data: NewSubscription) => {
    const rows = await db
      .insert(subscriptions)
      .values(data)
      .returning();
    return rows[0]!;
  },

  updateStatus: async (db: Db, id: number, status: string) => {
    const rows = await db
      .update(subscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return rows[0] ?? null;
  },

  upgradePlan: async (db: Db, userId: number, planId: number) => {
    const rows = await db
      .update(subscriptions)
      .set({ planId, status: "active", updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return rows[0] ?? null;
  },
};
