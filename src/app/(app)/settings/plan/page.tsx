"use client";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import SettingsHeader from "@/components/SettingsHeader";
import CompareTable from "@/components/pricing/CompareTable";
import PlanCards from "@/components/pricing/PlanCards";
import { useT } from "@/i18n/I18nProvider";

function UsageTile({ label, value, limit, pct }: { label: string; value: string; limit: string; pct: number }) {
  return (
    <div className="st-usage">
      <small>{label}</small>
      <p>
        <b>{value}</b> <span>/ {limit}</span>
      </p>
      <span className="st-meter-bar" aria-hidden>
        <i style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: pct > 100 ? "var(--bad)" : undefined }} />
      </span>
    </div>
  );
}

export default function PlanSettings() {
  const s = useStore();
  const { t, fmt } = useT();
  const counts = {
    boards: Object.keys(s.projects).length,
    members: Object.keys(s.members).length,
  };
  const limits = PLANS[s.plan];
  const overBoards = counts.boards > limits.boards;
  // Same rule as before the redesign: only the Owner, and only in demo mode
  const canSwitch = s.myRole === "Owner" && !s.realMode;

  return (
    <div className="pr-embedded">
      <SettingsHeader
        title={t("planPage.title")}
        hint={t("planPage.hint")}
        actions={
          <Link className="ghost" href="/pricing">
            {t("planPage.publicLink")} <ArrowRight size={16} aria-hidden className="pr-arrow" />
          </Link>
        }
      />

      <section className="card st-plans" aria-labelledby="st-plans-h">
        <h2 id="st-plans-h">{t("planPage.choose")}</h2>
        <p className="mute st-foot" style={{ marginTop: 0 }}>
          <Info size={14} aria-hidden /> {t("planPage.billingOff")} {s.realMode ? t("planPage.realNoChange") : t("planPage.demoSwitch")}
        </p>

        <div className="st-plan-cards">
          <PlanCards seats={Math.max(1, counts.members)} mode="settings" current={s.plan} canSwitch={canSwitch} onSwitch={s.setPlan} />
        </div>

        <div className="st-usage-grid" aria-label={t("planPage.usage")}>
          <UsageTile
            label={t("planPage.boards")}
            value={fmt.number(counts.boards)}
            limit={limits.boards === Infinity ? t("planPage.unlimited") : fmt.number(limits.boards)}
            pct={limits.boards === Infinity ? 0 : (counts.boards / limits.boards) * 100}
          />
          <UsageTile label={t("planPage.members")} value={fmt.number(counts.members)} limit={t("planPage.unlimited")} pct={0} />
          <UsageTile
            label={t("planPage.aiMonth")}
            value={fmt.number(s.aiUses)}
            limit={fmt.number(limits.aiPerMonth)}
            pct={limits.aiPerMonth ? (s.aiUses / limits.aiPerMonth) * 100 : 0}
          />
        </div>
        {overBoards && <p className="st-warn">{t("planPage.overLimit", { plan: t(`plan.${s.plan}`) })}</p>}
      </section>

      <section className="pr-compare" aria-labelledby="plan-compare-h">
        <div className="pr-sec-head">
          <h2 id="plan-compare-h" style={{ fontSize: 22 }}>
            {t("planPage.compare")}
          </h2>
        </div>
        <CompareTable />
      </section>
    </div>
  );
}
