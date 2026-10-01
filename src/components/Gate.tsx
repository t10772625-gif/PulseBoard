"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { requiredPlan } from "@/lib/plans";
import { useT } from "@/i18n/I18nProvider";
import { Plan } from "@/types";

// Shows children only when the current plan includes the feature; otherwise an
// upgrade prompt naming the plan that unlocks it (pricing Option 2).
export default function Gate({ id, children, compact }: { id: string; children: ReactNode; compact?: boolean }) {
  const { can } = useStore();
  const { t, rich } = useT();
  if (can(id)) return <>{children}</>;
  const need = t(`plan.${requiredPlan(id)}` as `plan.${Plan}`);
  if (compact)
    return (
      <Link href="/settings/plan" className="gate-chip" title={t("gate.availableOn", { plan: need })}>
        <Lock size={12} /> {need}
      </Link>
    );
  return (
    <div className="gate">
      <Lock size={16} />
      <span>{rich("gate.availableOnThe", { plan: need })}</span>
      <Link href="/settings/plan" className="ghost">
        {t("gate.upgrade")}
      </Link>
    </div>
  );
}

export function PlanTag({ id }: { id: string }) {
  const { t } = useT();
  const need = requiredPlan(id);
  if (need === "free") return null;
  return <span className={`plan-tag ${need}`}>{t(`plan.${need}`)}</span>;
}
