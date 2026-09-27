import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { plans } from "./plans";

/**
 * User subscriptions — links a user to their current plan.
 *
 * status:
 *   active | trialing | past_due | canceled | incomplete
 *
 * provider:
 *   manual | stripe | paddle | lemon_squeezy
 *
 * When a user signs up, assign them a FREE subscription automatically.
 * When they pay, create/update this row to PRO/PREMIUM.
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id")
    .notNull()
    .references(() => plans.id),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  provider: varchar("provider", { length: 50 }).notNull().default("manual"),
  providerSubscriptionId: varchar("provider_subscription_id", { length: 255 }),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
