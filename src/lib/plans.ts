import { Plan } from "@/types";

// Final pricing (renamed 2026-10-01, migration 20_rename-plan-tiers): Basic $0 =
// core board, Pro $12 = AI, views, integrations, email; Enterprise $18 = Smart
// Matching, workload and the big features. Prices and limits did not change.
export const PLANS: Record<Plan, { name: string; price: string; rank: number; members: number; boards: number; aiPerMonth: number; storageGb: number; support: string }> = {
  basic: { name: "Basic", price: "$0", rank: 0, members: Infinity, boards: 1, aiPerMonth: 0, storageGb: 1, support: "Community" },
  pro: { name: "Pro", price: "$12/user/mo", rank: 1, members: Infinity, boards: Infinity, aiPerMonth: 200, storageGb: 5, support: "Priority" },
  enterprise: { name: "Enterprise", price: "$18/user/mo", rank: 2, members: Infinity, boards: Infinity, aiPerMonth: 1000, storageGb: 10, support: "24/7" },
};

// Minimum plan per feature ID (IDs from docs/product/feature-audit.md).
// Anything not listed is available on Basic.
export const FEATURE_PLAN: Record<string, Plan> = {
  // Core / views
  "CORE-03": "pro",
  "CORE-11": "pro",
  "CORE-12": "pro",
  "CORE-19": "pro",
  "VIEW-03": "pro",
  "VIEW-04": "pro",
  "VIEW-05": "pro",
  "VIEW-06": "enterprise",
  "VIEW-07": "pro",
  "VIEW-08": "pro",
  "VIEW-09": "pro",
  "VIEW-10": "pro",
  "VIEW-11": "pro",
  // AI (Pro)
  "AI-03": "pro",
  "AI-04": "pro",
  "AI-05": "pro",
  "AI-16": "pro",
  "AI-19": "pro",
  "AI-21": "pro",
  "AI-23": "pro",
  "AI-24": "pro",
  "AI-25": "pro",
  "AI-14": "pro",
  // Smart Matching & big features (Enterprise)
  "AI-01": "enterprise",
  "AI-02": "enterprise",
  "AI-07": "enterprise",
  "AI-10": "enterprise",
  "AI-11": "enterprise",
  "AI-12": "enterprise",
  "AI-13": "enterprise",
  "AI-15": "enterprise",
  "AI-17": "enterprise",
  "AI-18": "enterprise",
  "AI-20": "enterprise",
  "AI-22": "enterprise",
  "AI-26": "enterprise",
  "AI-27": "enterprise",
  "AI-28": "enterprise",
  // Notifications
  "NOTIF-01": "pro",
  "NOTIF-02": "pro",
  "NOTIF-03": "pro",
  "NOTIF-04": "pro",
  "NOTIF-05": "enterprise",
  "NOTIF-06": "pro",
  // Time & focus
  "TIME-01": "pro",
  "TIME-02": "pro",
  "TIME-05": "pro",
  "TIME-06": "enterprise",
  "TIME-07": "enterprise",
  "TIME-08": "enterprise",
  "TIME-09": "enterprise",
  "TIME-10": "enterprise",
  "TIME-11": "enterprise",
  // Analytics
  "ANL-01": "pro",
  "ANL-02": "pro",
  "ANL-03": "pro",
  "ANL-04": "pro",
  "ANL-05": "pro",
  "ANL-06": "pro",
  "ANL-07": "enterprise",
  "ANL-08": "enterprise",
  "ANL-11": "enterprise",
  "ANL-12": "enterprise",
  // Collaboration
  "COL-03": "pro",
  "COL-04": "pro",
  "COL-05": "pro",
  "COL-06": "enterprise",
  "COL-10": "pro",
  // Security / platform
  "SEC-05": "enterprise",
  "SEC-12": "enterprise",
  "CORE-17-EXPORT": "enterprise",
  "ADV-01": "enterprise",
  "ADV-02": "enterprise",
  "ADV-03": "pro",
  "ADV-04": "enterprise",
  "ADV-05": "enterprise",
  "ADV-06": "enterprise",
  "MOB-09": "pro",
  // Clients & agency
  "CLI-01": "pro",
  "CLI-02": "enterprise",
  "CLI-03": "enterprise",
  "CLI-04": "enterprise",
  "CLI-05": "enterprise",
  "CLI-06": "enterprise",
  "CLI-07": "enterprise",
  "CLI-08": "pro",
  // Dev & integrations
  "DEV-01": "pro",
  "DEV-02": "enterprise",
  "INT-01": "pro",
  "INT-02": "pro",
  "INT-02-PAID": "enterprise",
  // Spec-only
  "SPEC-21": "pro",
  "SPEC-24": "enterprise",
  "SPEC-25": "enterprise",
  "SPEC-26": "pro",
  "SPEC-27": "enterprise",
};

// Plan value read from the database. Databases that haven't run migration
// 20_rename-plan-tiers still return the old labels (free / legendary); anything
// unknown falls back to the lowest tier so it never unlocks paid features.
const LEGACY_PLAN: Record<string, Plan> = { free: "basic", legendary: "enterprise" };
export function toPlan(value: string | null | undefined): Plan {
  if (value && Object.hasOwn(PLANS, value)) return value as Plan;
  return (value && Object.hasOwn(LEGACY_PLAN, value) && LEGACY_PLAN[value]) || "basic";
}

export function requiredPlan(featureId: string): Plan {
  return FEATURE_PLAN[featureId] ?? "basic";
}

export function hasFeature(plan: Plan, featureId: string): boolean {
  return PLANS[plan].rank >= PLANS[requiredPlan(featureId)].rank;
}
