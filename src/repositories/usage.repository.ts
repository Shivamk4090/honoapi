import { and, eq, sql } from "drizzle-orm";
import { Db } from "../db/client";
import { usage, features } from "../db/schema";

/**
 * Get current period string based on limit_period type.
 */
export function getCurrentPeriod(limitPeriod: string): string {
  const now = new Date();
  if (limitPeriod === "daily") {
    return now.toISOString().slice(0, 10); // "2024-01-15"
  }
  if (limitPeriod === "lifetime") {
    return "lifetime";
  }
  // default: monthly
  return now.toISOString().slice(0, 7); // "2024-01"
}

export const usageRepository = {
  /**
   * Get current period usage for a user+feature combination.
   */
  getUsage: async (
    db: Db,
    userId: number,
    featureCode: string,
    period: string
  ) => {
    const rows = await db
      .select({ count: usage.count })
      .from(usage)
      .innerJoin(features, eq(usage.featureId, features.id))
      .where(
        and(
          eq(usage.userId, userId),
          eq(features.code, featureCode),
          eq(usage.period, period)
        )
      );
    return rows[0]?.count ?? 0;
  },

  /**
   * Atomically increment usage count by 1 (UPSERT).
   * Uses ON CONFLICT to safely handle concurrent requests.
   */
  increment: async (
    db: Db,
    userId: number,
    featureCode: string,
    period: string
  ) => {
    // Resolve featureId first
    const featureRows = await db
      .select({ id: features.id })
      .from(features)
      .where(eq(features.code, featureCode));

    const featureId = featureRows[0]?.id;
    if (!featureId) return null;

    const rows = await db
      .insert(usage)
      .values({ userId, featureId, period, count: 1 })
      .onConflictDoUpdate({
        target: [usage.userId, usage.featureId, usage.period],
        set: {
          count: sql`${usage.count} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return rows[0] ?? null;
  },

  /**
   * Get all feature usage for a user in the current month (for dashboard).
   */
  getSummary: (db: Db, userId: number, period: string) =>
    db
      .select({
        featureCode: features.code,
        featureName: features.name,
        count: usage.count,
        period: usage.period,
      })
      .from(usage)
      .innerJoin(features, eq(usage.featureId, features.id))
      .where(and(eq(usage.userId, userId), eq(usage.period, period))),
};
