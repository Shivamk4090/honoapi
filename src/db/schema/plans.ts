import { pgTable, serial, varchar, text, integer, boolean } from "drizzle-orm/pg-core";

/**
 * Subscription plans — FREE, PRO, PREMIUM etc.
 * price_monthly / price_yearly in cents (e.g. 999 = $9.99)
 */
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),   // FREE | PRO | PREMIUM
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull().default(0), // cents
  priceYearly: integer("price_yearly").notNull().default(0),   // cents
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
