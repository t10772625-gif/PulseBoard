"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { PLANS, requiredPlan } from "@/lib/plans";

// Shows children only when the current plan includes the feature; otherwise an
// upgrade prompt naming the plan that unlocks it (pricing Option 2).
export default function Gate({ id, children, compact }: { id: string; children: ReactNode; compact?: boolean }) {
  const { can } = useStore();
  if (can(id)) return <>{children}</>;
  const need = PLANS[requiredPlan(id)].name;
  if (compact)
    return (
      <Link href="/settings#plan" className="gate-chip" title={`Available on ${need}`}>
        <Lock size={12} /> {need}
      </Link>
    );
  return (
    <div className="gate">
      <Lock size={16} />
      <span>
        Available on the <b>{need}</b> plan.
      </span>
      <Link href="/settings#plan" className="ghost">
        Upgrade
      </Link>
    </div>
  );
}

export function PlanTag({ id }: { id: string }) {
  const need = requiredPlan(id);
  if (need === "free") return null;
  return <span className={`plan-tag ${need}`}>{PLANS[need].name}</span>;
}
