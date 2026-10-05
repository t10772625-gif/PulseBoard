"use client";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PlanTag } from "./Gate";
import { useT } from "@/i18n/I18nProvider";

export type FeatureStatus = "connected" | "available" | "setup" | "decision" | "planned";

// Top card of an Integrations / AI sub-page: what the feature does, in plain words,
// with an honest status pill (Available / Setup required / Preview / Deferred …).
export function FeatureHero({ id, icon: Icon, title, text, status, statusText, planId, children }: { id: string; icon: LucideIcon; title: string; text: ReactNode; status?: FeatureStatus; statusText?: string; planId?: string; children?: ReactNode }) {
  return (
    <section className="card ux-hero" aria-labelledby={id}>
      <span className="ux-icon" aria-hidden>
        <Icon size={22} />
      </span>
      <div className="ux-hero-main">
        {(statusText || planId) && (
          <div className="ux-pills">
            {statusText && <span className={`int-st ${status ?? ""}`}>{statusText}</span>}
            {planId && <PlanTag id={planId} />}
          </div>
        )}
        <h2 id={id}>{title}</h2>
        <p className="mute">{text}</p>
        {children}
      </div>
    </section>
  );
}

// Numbered "How it works" steps (3–4)
export function HowItWorks({ id, steps }: { id: string; steps: { title: string; text: string }[] }) {
  const { t } = useT();
  return (
    <section className="card ux-sec" aria-labelledby={id}>
      <h2 id={id} style={{ margin: 0, fontSize: 17 }}>
        {t("ux.howItWorks")}
      </h2>
      <ol className="ux-steps">
        {steps.map((s) => (
          <li key={s.title}>
            <b>{s.title}</b>
            <span className="mute">{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Card heading row: small icon tile, title, and pills / controls on the end side
export function SecHead({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="ux-sec-head">
      <span className="ux-icon sm" aria-hidden>
        <Icon size={18} />
      </span>
      <h2 id={id}>{title}</h2>
      {children && <div className="ux-pills">{children}</div>}
    </div>
  );
}
