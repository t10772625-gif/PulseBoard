"use client";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SITE_FEATURES } from "@/lib/site";
import { useT } from "@/i18n/I18nProvider";
import { StatusChip } from "../pricing/CompareTable";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useSiteSession } from "./useSiteSession";

// Decorative board preview in the hero (not real data)
const PREVIEW: { col: "todo" | "prog" | "done"; cards: { key: string; title: string; tone: string; who: string }[] }[] = [
  { col: "todo", cards: [{ key: "PB-14", title: "site.preview.c1", tone: "#F0A400", who: "SA" }, { key: "PB-15", title: "site.preview.c2", tone: "#3A86FF", who: "BA" }] },
  { col: "prog", cards: [{ key: "PB-11", title: "site.preview.c3", tone: "#E5483A", who: "AR" }] },
  { col: "done", cards: [{ key: "PB-9", title: "site.preview.c4", tone: "#12B5A0", who: "AK" }] },
];

export default function LandingView() {
  const { t } = useT();
  const signedIn = useSiteSession();
  return (
    <div className="pr-page site-page">
      <SiteHeader />

      <section className="pr-hero site-hero">
        <div className="site-hero-text">
          <p className="pr-kicker">{t("site.home.kicker")}</p>
          <h1>
            {t("site.home.titleA")} <span>{t("site.home.titleB")}</span>
          </h1>
          <p className="pr-lead">{t("site.home.lead")}</p>
          <div className="site-cta-row">
            <Link className="pr-cta pr-cta-strong pr-cta-inline" href={signedIn ? "/dashboard" : "/register"}>
              {signedIn ? t("pricing.openApp") : t("site.home.ctaStart")} <ArrowRight size={18} aria-hidden className="pr-arrow" />
            </Link>
            <Link className="pr-cta pr-cta-inline site-cta-ghost" href="/features">
              {t("site.home.ctaFeatures")}
            </Link>
          </div>
          <ul className="site-hero-points">
            {(["site.home.point1", "site.home.point2", "site.home.point3"] as const).map((k) => (
              <li key={k}>
                <Check size={15} aria-hidden /> {t(k)}
              </li>
            ))}
          </ul>
        </div>
        <div className="site-board" aria-hidden>
          <div className="site-board-head">
            <b>{t("site.preview.board")}</b>
            <span className="site-health">82</span>
          </div>
          <div className="site-board-cols">
            {PREVIEW.map((c) => (
              <div key={c.col} className="site-col">
                <small>{t(`status.${c.col}`)}</small>
                {c.cards.map((card) => (
                  <div key={card.key} className="site-mini" style={{ borderInlineStartColor: card.tone }}>
                    <span className="task-key">{card.key}</span>
                    <p>{t(card.title as Parameters<typeof t>[0])}</p>
                    <i>{card.who}</i>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="site-feat-h">
        <div className="pr-sec-head">
          <h2 id="site-feat-h">{t("site.home.featuresTitle")}</h2>
          <p className="mute">{t("site.home.featuresLead")}</p>
        </div>
        <div className="site-grid">
          {SITE_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.slug} href={`/features/${f.slug}`} className="site-card" style={{ "--tone": f.tone } as React.CSSProperties}>
                <span className="site-ic" aria-hidden>
                  <Icon size={20} />
                </span>
                <b>{t(f.title)}</b>
                <span className="mute">{t(f.lead)}</span>
                <span className="site-more">
                  {t("site.learnMore")} <ArrowRight size={14} aria-hidden className="pr-arrow" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="site-section" aria-labelledby="site-how-h">
        <div className="pr-sec-head">
          <h2 id="site-how-h">{t("site.home.howTitle")}</h2>
        </div>
        <ol className="site-steps">
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <span className="site-step-n">{n}</span>
              <b>{t(`site.home.step${n}`)}</b>
              <span className="mute">{t(`site.home.step${n}Text`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="site-section site-honest" aria-labelledby="site-honest-h">
        <div>
          <h2 id="site-honest-h">{t("site.home.honestTitle")}</h2>
          <p className="mute">{t("site.home.honestText")}</p>
        </div>
        <ul>
          <li>
            <StatusChip s="app" /> {t("pricing.statusHint.app")}
          </li>
          <li>
            <StatusChip s="preview" /> {t("pricing.statusHint.preview")}
          </li>
          <li>
            <StatusChip s="planned" /> {t("pricing.statusHint.planned")}
          </li>
        </ul>
        <Link className="ghost" href="/pricing#pr-compare-h">
          {t("site.home.honestLink")}
        </Link>
      </section>

      <section className="pr-final">
        <h2>{t("site.home.finalTitle")}</h2>
        <p>{t("site.home.finalText")}</p>
        <Link className="pr-cta pr-cta-strong pr-cta-inline" href={signedIn ? "/dashboard" : "/register"}>
          {signedIn ? t("pricing.openApp") : t("pricing.createWorkspace")} <ArrowRight size={18} aria-hidden className="pr-arrow" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
