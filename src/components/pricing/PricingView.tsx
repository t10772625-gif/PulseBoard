"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { PRICING_FAQ, type FeatureStatus } from "@/lib/pricing";
import { useT } from "@/i18n/I18nProvider";
import PlanCards from "./PlanCards";
import CompareTable, { StatusChip } from "./CompareTable";
import LanguageSwitcher from "../LanguageSwitcher";

const SEAT_MIN = 1;
const SEAT_MAX = 200;

// Public pricing page. No checkout: billing isn't connected, so every call to
// action leads to a Free sign-up and the page says so up front.
export default function PricingView() {
  const { loggedIn } = useStore();
  const { t, rich } = useT();
  const [seats, setSeats] = useState(10);

  return (
    <div className="pr-page">
      <header className="pr-nav">
        <Link href={loggedIn ? "/dashboard" : "/pricing"} className="logo pr-logo" aria-label={t("pricing.homeLabel")}>
          <b></b>
          <span>PulseBoard</span>
        </Link>
        <nav aria-label={t("pricing.accountNav")}>
          <LanguageSwitcher />
          {loggedIn ? (
            <Link className="btn sm" href="/settings/plan">
              {t("pricing.yourPlan")}
            </Link>
          ) : (
            <>
              <Link className="ghost sm" href="/login">
                {t("pricing.signIn")}
              </Link>
              <Link className="btn sm" href="/register">
                {t("pricing.startFree")}
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="pr-hero">
        <p className="pr-kicker">{t("pricing.kicker")}</p>
        <h1>
          {t("pricing.heroA")} <span>{t("pricing.heroB")}</span>
        </h1>
        <p className="pr-lead">{t("pricing.lead")}</p>
        <div className="pr-notice" role="note">
          <Info size={18} aria-hidden />
          <p>{rich("pricing.notice")}</p>
        </div>
      </section>

      <section className="pr-seats" aria-label={t("pricing.teamSize")}>
        <label htmlFor="pr-seats">{rich("pricing.teamSizeLabel", { seats })}</label>
        <input
          id="pr-seats"
          type="range"
          min={SEAT_MIN}
          max={SEAT_MAX}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          aria-valuetext={t("pricing.seatsValue", { seats })}
          style={{ "--pct": `${((seats - SEAT_MIN) / (SEAT_MAX - SEAT_MIN)) * 100}%` } as React.CSSProperties}
        />
      </section>

      <PlanCards seats={seats} mode="public" />

      <section className="pr-compare" aria-labelledby="pr-compare-h">
        <div className="pr-sec-head">
          <h2 id="pr-compare-h">{t("pricing.compareTitle")}</h2>
          <ul className="pr-legend" aria-label={t("pricing.legendLabel")}>
            {(["app", "preview", "planned"] as FeatureStatus[]).map((s) => (
              <li key={s}>
                <StatusChip s={s} /> <span>{t(`pricing.statusHint.${s}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        <CompareTable />
      </section>

      <section className="pr-faq" aria-labelledby="pr-faq-h">
        <h2 id="pr-faq-h">{t("pricing.faqTitle")}</h2>
        {PRICING_FAQ.map((f) => (
          <details key={f.q}>
            <summary>{t(f.q)}</summary>
            <p>{t(f.a)}</p>
          </details>
        ))}
      </section>

      <section className="pr-final">
        <h2>{t("pricing.finalTitle")}</h2>
        <p>{t("pricing.finalBody")}</p>
        <Link className="pr-cta pr-cta-strong pr-cta-inline" href={loggedIn ? "/dashboard" : "/register"}>
          {loggedIn ? t("pricing.openApp") : t("pricing.createWorkspace")} <ArrowRight size={18} aria-hidden className="pr-arrow" />
        </Link>
      </section>
    </div>
  );
}
