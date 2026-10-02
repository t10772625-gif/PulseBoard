"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Info, Mail } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { hasErrors, v, type FieldMsg } from "@/lib/validate";
import Dropdown from "../Dropdown";
import FieldError, { invalid } from "../FieldError";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// Contact. Nothing is sent by PulseBoard's servers (no email provider is set up):
// a valid form opens the visitor's own email app with the message filled in,
// addressed to NEXT_PUBLIC_CONTACT_EMAIL (public, set in .env.local). Without that
// variable the page says contact isn't set up yet instead of pretending to send.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
const TOPICS = ["general", "sales", "support", "security", "partnership"] as const;

export default function ContactView() {
  const { t } = useT();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("general");
  const [errors, setErrors] = useState<Record<string, FieldMsg>>({});
  const [opened, setOpened] = useState(false);
  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(CONTACT_EMAIL);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "");
    const email = String(f.get("email") ?? "");
    const company = String(f.get("company") ?? "");
    const message = String(f.get("message") ?? "");
    const found = { name: v.name(name), email: v.email(email), company: v.maxLen(company, 120), message: v.text(message, 20, 3000) };
    setErrors(found);
    if (hasErrors(found) || !ready) return;
    const subject = `[PulseBoard] ${t(`site.contact.topic.${topic}`)} — ${name.trim()}`;
    const body = [message.trim(), "", `— ${name.trim()}`, email.trim(), company.trim()].filter((x, i) => i < 3 || x).join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <div className="pr-page site-page">
      <SiteHeader />
      <section className="pr-hero">
        <p className="pr-kicker">{t("site.contact.kicker")}</p>
        <h1>
          {t("site.contact.titleA")} <span>{t("site.contact.titleB")}</span>
        </h1>
        <p className="pr-lead">{t("site.contact.lead")}</p>
      </section>

      <section className="site-section site-two">
        <form className="card site-form" onSubmit={submit} onInput={(e) => setErrors((x) => ({ ...x, [(e.target as HTMLInputElement).name]: null }))} noValidate>
          <h2>{t("site.contact.formTitle")}</h2>
          {!ready && (
            <p className="st-demo-warn">
              <Info size={14} aria-hidden /> {t("site.contact.notSetUp")}
            </p>
          )}
          <div className="auth-grid">
            <label>
              {t("auth.fullName")}
              <input name="name" autoComplete="name" maxLength={80} placeholder={t("auth.namePlaceholder")} required {...invalid("err-cn", errors.name)} />
              <FieldError id="err-cn" msg={errors.name} />
            </label>
            <label>
              {t("common.email")}
              <input name="email" type="email" dir="ltr" autoComplete="email" maxLength={254} placeholder={t("auth.emailPlaceholder")} required {...invalid("err-ce", errors.email)} />
              <FieldError id="err-ce" msg={errors.email} />
            </label>
          </div>
          <div className="auth-grid">
            <label>
              <span>
                {t("site.contact.company")} <span className="mute">{t("auth.optional")}</span>
              </span>
              <input name="company" autoComplete="organization" maxLength={120} placeholder={t("auth.workspacePlaceholder")} {...invalid("err-cc", errors.company)} />
              <FieldError id="err-cc" msg={errors.company} />
            </label>
            <label>
              {t("site.contact.topic")}
              <Dropdown value={topic} onChange={setTopic} options={TOPICS.map((k) => ({ value: k, label: t(`site.contact.topic.${k}`) }))} />
            </label>
          </div>
          <label>
            {t("site.contact.message")}
            <textarea name="message" rows={6} maxLength={3000} placeholder={t("site.contact.messagePlaceholder")} required {...invalid("err-cm", errors.message)} />
            <FieldError id="err-cm" msg={errors.message} />
          </label>
          {opened && <p className="approval approved" role="status">{t("site.contact.opened")}</p>}
          <button className="btn" disabled={!ready}>
            <Mail size={16} aria-hidden /> {t("site.contact.send")}
          </button>
          <p className="mute" style={{ fontSize: 12 }}>{t("site.contact.privacy")}</p>
        </form>
        <div className="site-contact-side">
          <div className="card">
            <h2>{t("site.contact.securityTitle")}</h2>
            <p className="mute">{t("site.contact.securityText")}</p>
          </div>
          <div className="card">
            <h2>{t("site.contact.helpTitle")}</h2>
            <p className="mute">{t("site.contact.helpText")}</p>
            <div className="pill-row" style={{ marginTop: 10 }}>
              <Link className="ghost sm" href="/features">
                {t("site.nav.features")}
              </Link>
              <Link className="ghost sm" href="/pricing">
                {t("site.nav.pricing")}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
