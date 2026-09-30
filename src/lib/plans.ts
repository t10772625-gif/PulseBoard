import { Plan } from "@/types";

// Final pricing (docs/product/pricing.md): Free = basic core, Pro $12 = AI,
// views, integrations, email; Legendary $18 = Smart Matching, workload and the
// big features (including what used to be Enterprise). No Enterprise tier.
export const PLANS: Record<Plan, { name: string; price: string; rank: number; members: number; boards: number; aiPerMonth: number; storageGb: number; support: string }> = {
  free: { name: "Free", price: "$0", rank: 0, members: Infinity, boards: 1, aiPerMonth: 0, storageGb: 1, support: "Community" },
  pro: { name: "Pro", price: "$12/user/mo", rank: 1, members: Infinity, boards: Infinity, aiPerMonth: 200, storageGb: 5, support: "Priority" },
  legendary: { name: "Legendary", price: "$18/user/mo", rank: 2, members: Infinity, boards: Infinity, aiPerMonth: 1000, storageGb: 10, support: "24/7" },
};

// Minimum plan per feature ID (IDs from docs/product/feature-audit.md).
// Anything not listed is available on Free.
export const FEATURE_PLAN: Record<string, Plan> = {
  // Core / views
  "CORE-03": "pro",
  "CORE-11": "pro",
  "CORE-12": "pro",
  "CORE-19": "pro",
  "VIEW-03": "pro",
  "VIEW-04": "pro",
  "VIEW-05": "pro",
  "VIEW-06": "legendary",
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
  // Smart Matching & big features (Legendary)
  "AI-01": "legendary",
  "AI-02": "legendary",
  "AI-07": "legendary",
  "AI-10": "legendary",
  "AI-11": "legendary",
  "AI-12": "legendary",
  "AI-13": "legendary",
  "AI-15": "legendary",
  "AI-17": "legendary",
  "AI-18": "legendary",
  "AI-20": "legendary",
  "AI-22": "legendary",
  "AI-26": "legendary",
  "AI-27": "legendary",
  "AI-28": "legendary",
  // Notifications
  "NOTIF-01": "pro",
  "NOTIF-02": "pro",
  "NOTIF-03": "pro",
  "NOTIF-04": "pro",
  "NOTIF-05": "legendary",
  "NOTIF-06": "pro",
  // Time & focus
  "TIME-01": "pro",
  "TIME-02": "pro",
  "TIME-05": "pro",
  "TIME-06": "legendary",
  "TIME-07": "legendary",
  "TIME-08": "legendary",
  "TIME-09": "legendary",
  "TIME-10": "legendary",
  "TIME-11": "legendary",
  // Analytics
  "ANL-01": "pro",
  "ANL-02": "pro",
  "ANL-03": "pro",
  "ANL-04": "pro",
  "ANL-05": "pro",
  "ANL-06": "pro",
  "ANL-07": "legendary",
  "ANL-08": "legendary",
  "ANL-11": "legendary",
  "ANL-12": "legendary",
  // Collaboration
  "COL-03": "pro",
  "COL-04": "pro",
  "COL-05": "pro",
  "COL-06": "legendary",
  "COL-10": "pro",
  // Security / platform
  "SEC-05": "legendary",
  "SEC-12": "legendary",
  "CORE-17-EXPORT": "legendary",
  "ADV-01": "legendary",
  "ADV-02": "legendary",
  "ADV-03": "pro",
  "ADV-04": "legendary",
  "ADV-05": "legendary",
  "ADV-06": "legendary",
  "MOB-09": "pro",
  // Clients & agency
  "CLI-01": "pro",
  "CLI-02": "legendary",
  "CLI-03": "legendary",
  "CLI-04": "legendary",
  "CLI-05": "legendary",
  "CLI-06": "legendary",
  "CLI-07": "legendary",
  "CLI-08": "pro",
  // Dev & integrations
  "DEV-01": "pro",
  "DEV-02": "legendary",
  "INT-01": "pro",
  "INT-02": "pro",
  "INT-02-PAID": "legendary",
  // Spec-only
  "SPEC-21": "pro",
  "SPEC-24": "legendary",
  "SPEC-25": "legendary",
  "SPEC-26": "pro",
  "SPEC-27": "legendary",
};

export function requiredPlan(featureId: string): Plan {
  return FEATURE_PLAN[featureId] ?? "free";
}

export function hasFeature(plan: Plan, featureId: string): boolean {
  return PLANS[plan].rank >= PLANS[requiredPlan(featureId)].rank;
}
