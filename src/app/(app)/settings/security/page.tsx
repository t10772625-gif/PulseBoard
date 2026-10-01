"use client";
import { useState } from "react";
import { Check, Circle, Info, Monitor, ShieldCheck, Smartphone } from "lucide-react";
import { useStore } from "@/lib/store";
import { Switch } from "@/components/ui";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// Score (0–100) as a number, a level and a bar
function Strength({ value, label, level }: { value: number; label: string; level: string }) {
  return (
    <div className={`st-strength-meter ${level}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value} / 100 · ${label}`}>
      <p>
        <b>{value}</b>
        <span>/ 100</span>
        <em>{label}</em>
      </p>
      <span className="st-meter-bar" aria-hidden>
        <i style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

export default function SecuritySettings() {
  const s = useStore();
  const { t } = useT();
  const [otp, setOtp] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  // Demo device list: signing out the other device is local to this page
  const [otherSignedOut, setOtherSignedOut] = useState(false);
  const setupCode = "JBSW Y3DP EHPK 3PXP";

  // Transparent score: each check adds a fixed amount (explained under the meter)
  const checks: { key: MessageKey; on: boolean; points: number }[] = [
    { key: "security.chkPassword", on: true, points: 40 },
    { key: "security.chk2fa", on: s.twoFactor, points: 45 },
    { key: "security.chkSessions", on: otherSignedOut, points: 15 },
  ];
  const score = checks.reduce((sum, c) => sum + (c.on ? c.points : 0), 0);
  const level = score >= 85 ? "strong" : score >= 55 ? "good" : score >= 35 ? "fair" : "weak";
  const tip = !s.twoFactor ? t("security.tip2fa") : !otherSignedOut ? t("security.tipSessions") : t("security.tipDone");

  const sessions = [
    { icon: Monitor, name: t("security.thisBrowser"), when: t("security.thisBrowserWhen"), current: true },
    ...(otherSignedOut ? [] : [{ icon: Smartphone, name: t("security.otherDevice"), when: t("security.otherWhen"), current: false }]),
  ];

  return (
    <>
      <SettingsHeader title={t("security.title")} hint={t("security.hint")} />
      <div className="st-sec-grid">
        <section className="card st-strength" aria-labelledby="st-strength-h">
          <h2 id="st-strength-h">{t("security.strength")}</h2>
          <Strength value={score} label={t(`security.level.${level}`)} level={level} />
          <p className="mute">{tip}</p>
          <ul className="st-checks">
            {checks.map((c) => (
              <li key={c.key} className={c.on ? "on" : ""}>
                {c.on ? <Check size={14} aria-hidden /> : <Circle size={14} aria-hidden />}
                <span>{t(c.key)}</span>
                <b>+{c.points}</b>
              </li>
            ))}
          </ul>
          <p className="mute st-note">{t("security.scoreNote")}</p>
        </section>

        <section className="card" aria-labelledby="st-2fa-h">
          <h2 id="st-2fa-h">{t("security.twoFactor")}</h2>
          <div className="st-row">
            <span className="st-ic" aria-hidden>
              <ShieldCheck size={18} />
            </span>
            <div className="st-row-main">
              <b>{t("security.authApp")}</b>
              <p className="mute">{s.twoFactor ? t("security.twoFactorOnHint") : t("security.twoFactorOffHint")}</p>
            </div>
            <Switch
              label={t("security.twoFactor")}
              checked={s.twoFactor || setupOpen}
              onChange={(v) => {
                if (v) {
                  setOtp("");
                  setSetupOpen(true);
                } else {
                  s.setTwoFactor(false);
                  setSetupOpen(false);
                  s.toast(t("security.twoFactorOffToast"));
                }
              }}
            />
          </div>
          {setupOpen && !s.twoFactor && (
            <div className="ai-out">
              <p style={{ fontSize: 13 }}>{t("security.setupKey")}</p>
              <p className="code" style={{ margin: "6px 0" }} dir="ltr">
                {setupCode}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input inputMode="numeric" maxLength={6} placeholder="123456" dir="ltr" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                <button
                  className="btn sm"
                  onClick={() => {
                    if (otp.length !== 6) return s.toast(t("security.enterCode"));
                    s.setTwoFactor(true);
                    setSetupOpen(false);
                    s.toast(t("security.enabledDemo"));
                  }}
                >
                  {t("security.verify")}
                </button>
              </div>
            </div>
          )}

          <h2 style={{ marginTop: 22 }}>{t("security.sessions")}</h2>
          <div className="st-list">
            {sessions.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.name} className="st-row">
                  <span className="st-ic" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <div className="st-row-main">
                    <b>{d.name}</b>
                    <p className="mute">{d.when}</p>
                  </div>
                  {d.current ? (
                    <span className="st-pill">{t("common.current")}</span>
                  ) : (
                    <button
                      className="ghost"
                      onClick={() => {
                        setOtherSignedOut(true);
                        s.toast(t("security.signedOutDemo"));
                      }}
                    >
                      {t("security.signOut")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mute st-foot">
            <Info size={14} aria-hidden /> {t("security.footnote")}
          </p>
          <p className="mute st-foot">
            <Info size={14} aria-hidden /> {t("security.demoNote")}
          </p>
        </section>
      </div>
    </>
  );
}
