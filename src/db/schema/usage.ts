import { pgTable, serial, integer, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { features } from "./features";

/**
 * Per-user feature usage tracking.
 *
 * period format: "YYYY-MM" for monthly, "YYYY-MM-DD" for daily, "lifetime" for lifetime.
 *
 * Increment count on each feature use.
 * Compare count vs plan_features.limit_value to allow/deny.
 */
export const usage = pgTable(
  "usage",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    featureId: integer("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    period: varchar("period", { length: 20 }).notNull(), // "2024-01" | "2024-01-15" | "lifetime"
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqUsage: unique().on(t.userId, t.featureId, t.period),
  })
);

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
