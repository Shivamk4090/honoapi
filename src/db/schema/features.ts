import { pgTable, serial, varchar, text } from "drizzle-orm/pg-core";

/**
 * Feature catalogue — every feature the platform offers.
 * code is used as the key in entitlement checks.
 *
 * Examples:
 *   image_generation, api_access, analytics, projects, team_members
 */
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
});

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
