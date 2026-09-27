/**
 * Seed script — populates default plans, features, and plan_features.
 *
 * Run:
 *   npm run db:seed
 *
 * This creates the FREE / PRO / PREMIUM plans with example features.
 * Customize the plans and features for your specific SaaS product.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL env var is required");

const db = drizzle(neon(DATABASE_URL), { schema });

async function seed() {
  console.log("🌱 Seeding plans, features, and plan_features...\n");

  // ── 1. Plans ─────────────────────────────────────────────────────────────────
  const [free, pro, premium] = await db
    .insert(schema.plans)
    .values([
      {
        code: "FREE",
        name: "Free",
        description: "Get started for free",
        priceMonthly: 0,
        priceYearly: 0,
        sortOrder: 0,
      },
      {
        code: "PRO",
        name: "Pro",
        description: "For individuals and small teams",
        priceMonthly: 999,   // $9.99/month
        priceYearly: 9900,   // $99/year
        sortOrder: 1,
      },
      {
        code: "PREMIUM",
        name: "Premium",
        description: "For power users and growing teams",
        priceMonthly: 2999,  // $29.99/month
        priceYearly: 29900,  // $299/year
        sortOrder: 2,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("✅ Plans:", { free: free?.code, pro: pro?.code, premium: premium?.code });

  // ── 2. Features ───────────────────────────────────────────────────────────────
  // Replace these with features relevant to your SaaS product
  const featureRows = await db
    .insert(schema.features)
    .values([
      { code: "api_requests",       name: "API Requests",         description: "Monthly API requests" },
      { code: "projects",           name: "Projects",             description: "Active projects" },
      { code: "team_members",       name: "Team Members",         description: "Team seats" },
      { code: "analytics",          name: "Analytics",            description: "Advanced analytics access" },
      { code: "api_access",         name: "API Access",           description: "Programmatic API access" },
      { code: "priority_support",   name: "Priority Support",     description: "Priority email & chat support" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("✅ Features:", featureRows.map((f) => f.code));

  // Re-fetch to get IDs (in case onConflictDoNothing skipped inserts)
  const allPlans = await db.select().from(schema.plans);
  const allFeatures = await db.select().from(schema.features);

  const planMap = Object.fromEntries(allPlans.map((p) => [p.code, p.id]));
  const featMap = Object.fromEntries(allFeatures.map((f) => [f.code, f.id]));

  // ── 3. Plan Features (the limits matrix) ─────────────────────────────────────
  //
  //  limitValue:
  //    -1  = unlimited
  //     0  = not available on this plan
  //     N  = N per limitPeriod
  //
  await db
    .insert(schema.planFeatures)
    .values([
      // FREE plan
      { planId: planMap["FREE"]!, featureId: featMap["api_requests"]!,     limitValue: 100,  limitPeriod: "monthly" },
      { planId: planMap["FREE"]!, featureId: featMap["projects"]!,          limitValue: 1,    limitPeriod: "lifetime" },
      { planId: planMap["FREE"]!, featureId: featMap["team_members"]!,      limitValue: 0,    limitPeriod: "lifetime" }, // not available
      { planId: planMap["FREE"]!, featureId: featMap["analytics"]!,         limitValue: 0,    limitPeriod: "monthly" }, // not available
      { planId: planMap["FREE"]!, featureId: featMap["api_access"]!,        limitValue: 0,    limitPeriod: "monthly" }, // not available
      { planId: planMap["FREE"]!, featureId: featMap["priority_support"]!,  limitValue: 0,    limitPeriod: "monthly" }, // not available

      // PRO plan
      { planId: planMap["PRO"]!, featureId: featMap["api_requests"]!,      limitValue: 5000,  limitPeriod: "monthly" },
      { planId: planMap["PRO"]!, featureId: featMap["projects"]!,           limitValue: 20,    limitPeriod: "lifetime" },
      { planId: planMap["PRO"]!, featureId: featMap["team_members"]!,       limitValue: 5,     limitPeriod: "lifetime" },
      { planId: planMap["PRO"]!, featureId: featMap["analytics"]!,          limitValue: -1,    limitPeriod: "monthly" }, // unlimited
      { planId: planMap["PRO"]!, featureId: featMap["api_access"]!,         limitValue: -1,    limitPeriod: "monthly" }, // unlimited
      { planId: planMap["PRO"]!, featureId: featMap["priority_support"]!,   limitValue: 0,     limitPeriod: "monthly" }, // not available

      // PREMIUM plan
      { planId: planMap["PREMIUM"]!, featureId: featMap["api_requests"]!,      limitValue: -1,  limitPeriod: "monthly" }, // unlimited
      { planId: planMap["PREMIUM"]!, featureId: featMap["projects"]!,           limitValue: -1,  limitPeriod: "lifetime" }, // unlimited
      { planId: planMap["PREMIUM"]!, featureId: featMap["team_members"]!,       limitValue: 20,  limitPeriod: "lifetime" },
      { planId: planMap["PREMIUM"]!, featureId: featMap["analytics"]!,          limitValue: -1,  limitPeriod: "monthly" }, // unlimited
      { planId: planMap["PREMIUM"]!, featureId: featMap["api_access"]!,         limitValue: -1,  limitPeriod: "monthly" }, // unlimited
      { planId: planMap["PREMIUM"]!, featureId: featMap["priority_support"]!,   limitValue: -1,  limitPeriod: "monthly" }, // unlimited
    ])
    .onConflictDoNothing();

  console.log("✅ Plan features matrix seeded\n");
  console.log("📊 Limits Matrix:");
  console.log("Feature            FREE     PRO      PREMIUM");
  console.log("─────────────────────────────────────────────");
  console.log("api_requests        100    5,000    unlimited");
  console.log("projects              1       20    unlimited");
  console.log("team_members          -        5           20");
  console.log("analytics             -        ✅          ✅");
  console.log("api_access            -        ✅          ✅");
  console.log("priority_support      -         -          ✅");
  console.log("\n🎉 Seed complete!");
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
