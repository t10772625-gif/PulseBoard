"use client";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";

// Any URL that doesn't match a page. Signed-out visitors who follow "Go to Home"
// are sent to the login page by the app layout.
export default function NotFound() {
  const { t } = useT();
  return (
    <main className="nf-page">
      <div className="card">
        <div className="logo">
          <b></b>PulseBoard
        </div>
        <p className="nf-code">404</p>
        <h1 style={{ margin: 0 }}>{t("nf.title")}</h1>
        <p className="mute">{t("nf.hint")}</p>
        <Link className="btn" href="/dashboard">
          {t("layout.goHome")}
        </Link>
      </div>
    </main>
  );
}
