"use client";
import Link from "next/link";
import { ArrowRight, Eye, Languages, ShieldCheck, Users } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// About: what PulseBoard is and how it's built. No team bios, customer logos or
// numbers — nothing here that isn't true of the product today.
const VALUES = [
  { icon: ShieldCheck, title: "site.about.v1", text: "site.about.v1Text" },
  { icon: Eye, title: "site.about.v2", text: "site.about.v2Text" },
  { icon: Users, title: "site.about.v3", text: "site.about.v3Text" },
  { icon: Languages, title: "site.about.v4", text: "site.about.v4Text" },
] as const;

export default function AboutView() {
  const { t } = useT();
  return (
    <div className="pr-page site-page">
      <SiteHeader />
      <section className="pr-hero">
        <p className="pr-kicker">{t("site.about.kicker")}</p>
        <h1>
          {t("site.about.titleA")} <span>{t("site.about.titleB")}</span>
        </h1>
        <p className="pr-lead">{t("site.about.lead")}</p>
      </section>

      <section className="site-section site-two">
        <div>
          <h2>{t("site.about.whyTitle")}</h2>
          <p>{t("site.about.why1")}</p>
          <p>{t("site.about.why2")}</p>
        </div>
        <div className="card">
          <h2>{t("site.about.statusTitle")}</h2>
          <p className="mute">{t("site.about.statusText")}</p>
          <Link className="site-more" href="/pricing#pr-compare-h">
            {t("site.home.honestLink")} <ArrowRight size={14} aria-hidden className="pr-arrow" />
          </Link>
        </div>
      </section>

      <section className="site-section" aria-labelledby="site-values-h">
        <div className="pr-sec-head">
          <h2 id="site-values-h">{t("site.about.valuesTitle")}</h2>
        </div>
        <div className="site-grid">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="site-card site-card-static">
                <span className="site-ic" aria-hidden>
                  <Icon size={20} />
                </span>
                <b>{t(v.title)}</b>
                <span className="mute">{t(v.text)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pr-final">
        <h2>{t("site.about.finalTitle")}</h2>
        <p>{t("site.about.finalText")}</p>
        <Link className="pr-cta pr-cta-strong pr-cta-inline" href="/contact">
          {t("site.nav.contact")} <ArrowRight size={18} aria-hidden className="pr-arrow" />
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}
