"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SITE_NAV } from "@/lib/site";
import { useT } from "@/i18n/I18nProvider";
import LanguageSwitcher from "../LanguageSwitcher";
import { useSiteSession } from "./useSiteSession";

// Header for every public page. Signed in: "Open app" and "Your plan" instead of
// Sign in / Start free.
export default function SiteHeader() {
  const { t } = useT();
  const signedIn = useSiteSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="pr-nav site-nav">
      <Link href="/" className="logo pr-logo" aria-label={t("site.homeLabel")}>
        <b></b>
        <span>PulseBoard</span>
      </Link>
      <button className="ghost sm site-menu-btn" aria-expanded={open} aria-controls="site-links" aria-label={open ? t("site.closeMenu") : t("site.openMenu")} onClick={() => setOpen((o) => !o)}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <div id="site-links" className={`site-links ${open ? "open" : ""}`}>
        <nav aria-label={t("site.mainNav")}>
          {SITE_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`site-link ${path === n.href || path.startsWith(n.href + "/") ? "on" : ""}`} aria-current={path === n.href ? "page" : undefined} onClick={() => setOpen(false)}>
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="site-actions">
          <LanguageSwitcher />
          {signedIn ? (
            <>
              <Link className="ghost sm" href="/settings/plan">
                {t("pricing.yourPlan")}
              </Link>
              <Link className="btn sm" href="/dashboard">
                {t("pricing.openApp")}
              </Link>
            </>
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
        </div>
      </div>
    </header>
  );
}
