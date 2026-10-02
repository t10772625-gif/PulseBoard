"use client";
import Link from "next/link";
import { Check, Crown, Rocket, Sprout } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { PLAN_PITCH } from "@/lib/pricing";
import { useT } from "@/i18n/I18nProvider";
import { Plan } from "@/types";

const ICON = { basic: Sprout, pro: Rocket, enterprise: Crown } as const;
export const PLAN_ORDER: Plan[] = ["basic", "pro", "enterprise"];

// Per-user monthly price in USD, read from PLANS so the price lives in one place
export function pricePerUser(p: Plan): number {
  const m = PLANS[p].price.match(/\$(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

type Props = {
  seats: number;
  // Public page: every card links to sign-up. Settings: shows the current plan
  // and lets the Owner switch (demo: local; real mode: saved via test_set_plan).
  mode: "public" | "settings";
  current?: Plan;
  canSwitch?: boolean;
  onSwitch?: (p: Plan) => void;
  // Real mode: the switch is saved to the database (test switch until Stripe)
  testMode?: boolean;
  // Public page while signed in: show your current plan, link to Settings → Plan
  signedIn?: boolean;
};

export default function PlanCards({ seats, mode, current, canSwitch, onSwitch, testMode, signedIn }: Props) {
  const { t, fmt } = useT();
  return (
    <div className="pr-cards">
      {PLAN_ORDER.map((p) => {
        const Icon = ICON[p];
        const pitch = PLAN_PITCH[p];
        const per = pricePerUser(p);
        const isCurrent = current === p;
        const name = t(`plan.${p}`);
        return (
          <article key={p} className={`pr-card pr-${p} ${isCurrent ? "pr-current" : ""}`} aria-labelledby={`pr-${p}-name`}>
            {p === "enterprise" && <span className="pr-glow" aria-hidden />}
            <div className="pr-card-in">
              <header className="pr-card-head">
                <span className="pr-icon" aria-hidden>
                  <Icon size={20} />
                </span>
                <h3 id={`pr-${p}-name`}>{name}</h3>
                {pitch.badge && <span className="pr-badge">{t(pitch.badge)}</span>}
              </header>
              <p className="pr-tag">{t(pitch.tagline)}</p>
              <p className="pr-price">
                <b>{fmt.currency(per)}</b>
                <span>{per === 0 ? t("pricing.forever") : t("pricing.perUserMonth")}</span>
              </p>
              <p className="pr-total" aria-live="polite">
                {per === 0 ? t("pricing.totalFree", { amount: fmt.currency(0), seats }) : t("pricing.totalPaid", { amount: fmt.currency(per * seats), seats })}
              </p>
              <ul className="pr-list">
                {pitch.highlights.map((h) => (
                  <li key={h}>
                    <Check size={16} aria-hidden /> {t(h)}
                  </li>
                ))}
              </ul>
              {mode === "public" && signedIn ? (
                isCurrent ? (
                  <span className="pr-cta pr-cta-current">{t("pricing.currentPlan")}</span>
                ) : (
                  <Link className={`pr-cta ${p === "basic" ? "" : "pr-cta-strong"}`} href="/settings/plan">
                    {t("pricing.changeInSettings", { plan: name })}
                  </Link>
                )
              ) : mode === "public" ? (
                <Link className={`pr-cta ${p === "basic" ? "" : "pr-cta-strong"}`} href="/register">
                  {p === "basic" ? t("pricing.startFree") : t("pricing.startFreeLater", { plan: name })}
                </Link>
              ) : isCurrent ? (
                <span className="pr-cta pr-cta-current">{t("pricing.currentPlan")}</span>
              ) : (
                <button
                  className={`pr-cta ${p === "enterprise" ? "pr-cta-strong" : ""}`}
                  disabled={!canSwitch}
                  onClick={() => onSwitch?.(p)}
                  title={canSwitch ? t("pricing.switchTitleOk") : t("pricing.switchTitleNo")}
                >
                  {testMode ? t("pricing.switchTest", { plan: name }) : t("pricing.switchDemo", { plan: name })}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
