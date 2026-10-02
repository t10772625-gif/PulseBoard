"use client";
import Link from "next/link";
import { SITE_FEATURES } from "@/lib/site";
import { useT } from "@/i18n/I18nProvider";

export default function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="site-footer">
      <div className="site-foot-brand">
        <Link href="/" className="logo pr-logo">
          <b></b>
          <span>PulseBoard</span>
        </Link>
        <p className="mute">{t("site.footer.tagline")}</p>
        <p className="mute site-foot-note">{t("site.footer.status")}</p>
      </div>
      <nav aria-label={t("site.footer.product")}>
        <b>{t("site.footer.product")}</b>
        <Link href="/features">{t("site.nav.features")}</Link>
        {SITE_FEATURES.slice(0, 4).map((f) => (
          <Link key={f.slug} href={`/features/${f.slug}`}>
            {t(f.title)}
          </Link>
        ))}
        <Link href="/pricing">{t("site.nav.pricing")}</Link>
      </nav>
      <nav aria-label={t("site.footer.company")}>
        <b>{t("site.footer.company")}</b>
        <Link href="/about">{t("site.nav.about")}</Link>
        <Link href="/contact">{t("site.nav.contact")}</Link>
      </nav>
      <nav aria-label={t("site.footer.account")}>
        <b>{t("site.footer.account")}</b>
        <Link href="/login">{t("pricing.signIn")}</Link>
        <Link href="/register">{t("site.footer.create")}</Link>
      </nav>
      <p className="mute site-copy">{t("site.footer.copy", { year: new Date().getFullYear() })}</p>
    </footer>
  );
}
