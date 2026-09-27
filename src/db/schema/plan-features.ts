import { pgTable, serial, integer, varchar, unique } from "drizzle-orm/pg-core";
import { plans } from "./plans";
import { features } from "./features";

/**
 * Maps which features each plan has, and the usage limit per period.
 *
 * limit_value:
 *   -1  = unlimited
 *    0  = feature not available on this plan
 *    N  = N uses per limit_period
 *
 * limit_period:
 *   monthly | daily | lifetime
 */
export const planFeatures = pgTable(
  "plan_features",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureId: integer("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    limitValue: integer("limit_value").notNull().default(-1),
    limitPeriod: varchar("limit_period", { length: 20 }).notNull().default("monthly"),
  },
  (t) => ({
    uniqPlanFeature: unique().on(t.planId, t.featureId),
  })
);

export type PlanFeature = typeof planFeatures.$inferSelect;
export type NewPlanFeature = typeof planFeatures.$inferInsert;
