"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE_FEATURES, featureBySlug } from "@/lib/site";
import { useT } from "@/i18n/I18nProvider";
import { StatusChip } from "../pricing/CompareTable";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useSiteSession } from "./useSiteSession";

function Points({ slug }: { slug: string }) {
  const { t } = useT();
  const f = featureBySlug(slug);
  if (!f) return null;
  return (
    <ul className="site-points">
      {f.points.map((p) => (
        <li key={p.text}>
          <span>{t(p.text)}</span>
          <span className="site-point-tags">
            {p.plan && p.plan !== "basic" && <PlanTagFor plan={p.plan} />}
            <StatusChip s={p.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Plan badge (same look as PlanTag in Gate.tsx, which takes a feature id instead)
function PlanTagFor({ plan }: { plan: "pro" | "enterprise" }) {
  const { t } = useT();
  return <span className={`plan-tag ${plan}`}>{t(`plan.${plan}`)}</span>;
}

// /features — every core feature with its points and their real build status
export function FeaturesOverview() {
  const { t } = useT();
  return (
    <div className="pr-page site-page">
      <SiteHeader />
      <section className="pr-hero">
        <p className="pr-kicker">{t("site.features.kicker")}</p>
        <h1>
          {t("site.features.titleA")} <span>{t("site.features.titleB")}</span>
        </h1>
        <p className="pr-lead">{t("site.features.lead")}</p>
      </section>
      <div className="site-feature-list">
        {SITE_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <section key={f.slug} className="card site-feature" style={{ "--tone": f.tone } as React.CSSProperties} aria-labelledby={`f-${f.slug}`}>
              <div className="site-feature-head">
                <span className="site-ic" aria-hidden>
                  <Icon size={20} />
                </span>
                <div>
                  <h2 id={`f-${f.slug}`}>{t(f.title)}</h2>
                  <p className="mute">{t(f.lead)}</p>
                </div>
              </div>
              <Points slug={f.slug} />
              <Link className="site-more" href={`/features/${f.slug}`}>
                {t("site.learnMore")} <ArrowRight size={14} aria-hidden className="pr-arrow" />
              </Link>
            </section>
          );
        })}
      </div>
      <SiteFooter />
    </div>
  );
}

// /features/[slug] — one core feature
export function FeatureDetail({ slug }: { slug: string }) {
  const { t } = useT();
  const signedIn = useSiteSession();
  const f = featureBySlug(slug);
  if (!f) return null;
  const Icon = f.icon;
  const others = SITE_FEATURES.filter((x) => x.slug !== slug).slice(0, 3);
  return (
    <div className="pr-page site-page">
      <SiteHeader />
      <nav className="site-crumb" aria-label={t("site.crumbLabel")}>
        <Link href="/features">{t("site.nav.features")}</Link> / <span>{t(f.title)}</span>
      </nav>
      <section className="pr-hero site-detail-hero" style={{ "--tone": f.tone } as React.CSSProperties}>
        <span className="site-ic site-ic-lg" aria-hidden>
          <Icon size={26} />
        </span>
        <h1>{t(f.title)}</h1>
        <p className="pr-lead">{t(f.lead)}</p>
      </section>
      <section className="card site-feature" style={{ "--tone": f.tone } as React.CSSProperties} aria-label={t("site.features.whatYouGet")}>
        <h2>{t("site.features.whatYouGet")}</h2>
        <Points slug={f.slug} />
        <p className="mute site-foot-note">{t("site.features.statusNote")}</p>
      </section>
      <section className="site-section" aria-labelledby="site-more-h">
        <div className="pr-sec-head">
          <h2 id="site-more-h">{t("site.features.more")}</h2>
        </div>
        <div className="site-grid site-grid-3">
          {others.map((o) => {
            const OIcon = o.icon;
            return (
              <Link key={o.slug} href={`/features/${o.slug}`} className="site-card" style={{ "--tone": o.tone } as React.CSSProperties}>
                <span className="site-ic" aria-hidden>
                  <OIcon size={20} />
                </span>
                <b>{t(o.title)}</b>
                <span className="mute">{t(o.lead)}</span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="pr-final">
        <h2>{t("site.home.finalTitle")}</h2>
        <Link className="pr-cta pr-cta-strong pr-cta-inline" href={signedIn ? "/dashboard" : "/register"}>
          {signedIn ? t("pricing.openApp") : t("pricing.createWorkspace")} <ArrowRight size={18} aria-hidden className="pr-arrow" />
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
}
