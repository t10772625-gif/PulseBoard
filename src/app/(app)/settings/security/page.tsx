"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Check, ChevronRight, Circle, Info, KeyRound, Laptop, LogOut, Monitor, MonitorSmartphone, Plus, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
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

type Session = { id: string; created_at: string; last_active: string; user_agent: string; ip: string | null; aal: string; current: boolean };

// "Chrome on Windows" from a user-agent string (display only; never used for security decisions)
function deviceName(ua: string): { name: string; mobile: boolean } {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return { name: [browser, os].filter(Boolean).join(" · "), mobile: /Mobile|iPhone|Android/.test(ua) };
}

export default function SecuritySettings() {
  const s = useStore();
  const { t, fmt } = useT();
  const sb = getSupabase();
  const live = s.realMode && !!sb;

  // ---- Two-factor authentication (Supabase TOTP) ----
  const [factorId, setFactorId] = useState<string | null>(null); // verified factor
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  const loadFactors = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.auth.mfa.listFactors();
    setFactorId(data?.totp.find((f) => f.status === "verified")?.id ?? null);
    const { data: u } = await sb.auth.getUser();
    setHasPassword(!!u.user?.identities?.some((i) => i.provider === "email"));
  }, [sb]);

  async function startSetup() {
    if (!sb) return;
    setBusy(true);
    // A setup that was started but never verified blocks a new one: remove it first
    const { data } = await sb.auth.mfa.listFactors();
    for (const f of data?.all ?? []) if (f.factor_type === "totp" && f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data: enrolled, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `PulseBoard ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (error || !enrolled) {
      console.error("[mfa enroll]", error);
      return s.toast(t("security.setupFailed"));
    }
    const qr = await QRCode.toDataURL(enrolled.totp.uri, { margin: 1, width: 180 });
    setOtp("");
    setSetup({ id: enrolled.id, qr, secret: enrolled.totp.secret });
  }

  async function confirmSetup() {
    if (!sb || !setup) return;
    if (!/^\d{6}$/.test(otp)) return s.toast(t("security.enterCode"));
    setBusy(true);
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: setup.id, code: otp });
    setBusy(false);
    if (error) {
      console.error("[mfa verify]", error);
      return s.toast(t("auth.err.code"));
    }
    setSetup(null);
    await loadFactors();
    s.toast(t("security.enabledReal"));
  }

  async function turnOff() {
    if (!sb || !factorId) return;
    if (!window.confirm(t("security.confirmOff"))) return;
    setBusy(true);
    const { error } = await sb.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      console.error("[mfa unenroll]", error);
      return s.toast(t("security.offFailed"));
    }
    await loadFactors();
    s.toast(t("security.twoFactorOffToast"));
  }

  // ---- Signed-in devices ----
  const [sessions, setSessions] = useState<Session[] | null>(null);
  // The device list needs a database function from the account-security update (23);
  // until it exists the list can't load, and the page says so instead of showing nothing
  const [sessionsUnavailable, setSessionsUnavailable] = useState(false);
  const loadSessions = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.rpc("list_my_sessions");
    if (error) {
      console.error("[sessions]", error);
      setSessionsUnavailable(true);
      setSessions([]);
      return;
    }
    setSessionsUnavailable(false);
    setSessions(data as Session[]);
  }, [sb]);

  useEffect(() => {
    if (!live) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from Supabase once on open
    void loadFactors();
    void loadSessions();
  }, [live, loadFactors, loadSessions]);

  async function signOutSession(id: string) {
    if (!sb) return;
    const { error } = await sb.rpc("revoke_my_session", { session: id });
    if (error) return s.toast(t("store.saveFailed"));
    s.toast(t("security.sessionEnded"));
    void loadSessions();
  }

  async function signOutOthers() {
    if (!sb || !window.confirm(t("security.confirmOthers"))) return;
    const { error } = await sb.auth.signOut({ scope: "others" });
    if (error) return s.toast(t("store.saveFailed"));
    s.toast(t("security.othersEnded"));
    void loadSessions();
  }

  // ---- Add a device: scan to open the sign-in page on a phone ----
  const [addQr, setAddQr] = useState<string | null>(null);
  async function showAddDevice() {
    if (addQr) return setAddQr(null);
    setAddQr(await QRCode.toDataURL(`${window.location.origin}/login`, { margin: 1, width: 160 }));
  }

  // Transparent score: each check adds a fixed amount (explained under the meter)
  const twoFactorOn = !!factorId;
  const checks: { key: MessageKey; on: boolean; points: number }[] = [
    { key: "security.chkPassword", on: hasPassword, points: 55 },
    { key: "security.chk2faReal", on: twoFactorOn, points: 45 },
  ];
  const score = checks.reduce((sum, c) => sum + (c.on ? c.points : 0), 0);
  const level = score >= 85 ? "strong" : score >= 55 ? "good" : score >= 35 ? "fair" : "weak";
  const tip = !twoFactorOn ? t("security.tip2fa") : t("security.tipDone");
  const when = (iso: string) => fmt.date(new Date(iso), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  // Demo mode (or a database without the device list) shows only this browser
  const deviceRows: Session[] = live && !sessionsUnavailable
    ? sessions ?? []
    : [{ id: "this", created_at: new Date().toISOString(), last_active: new Date().toISOString(), user_agent: typeof navigator === "undefined" ? "" : navigator.userAgent, ip: null, aal: "aal1", current: true }];

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
          <p className="mute st-note">{t("security.scoreNoteReal")}</p>
        </section>

        <div className="ux-page">
          <section className="card ux-sec" aria-labelledby="st-2fa-h">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <ShieldCheck size={18} />
              </span>
              <h2 id="st-2fa-h">{t("security.twoFactor")}</h2>
              <div className="ux-pills">
                {!live ? (
                  <span className="int-st setup">{t("security.stDemo")}</span>
                ) : twoFactorOn ? (
                  <span className="int-st connected">{t("security.stOn")}</span>
                ) : (
                  <span className="int-st">{t("security.stOff")}</span>
                )}
              </div>
            </div>
            <div className="ux-rows">
              <div className="st-row">
                <div className="st-row-main">
                  <b>{t("security.authApp")}</b>
                  <p className="mute">{twoFactorOn ? t("security.twoFactorOnReal") : t("security.twoFactorOffHint")}</p>
                </div>
                <Switch
                  label={t("security.twoFactor")}
                  checked={twoFactorOn || !!setup}
                  disabled={!live || busy}
                  onChange={(v) => {
                    if (v) void startSetup();
                    else if (setup) setSetup(null);
                    else void turnOff();
                  }}
                />
              </div>
            </div>
            {!live && (
              <p className="st-demo-warn" style={{ margin: 0 }}>
                <TriangleAlert size={14} aria-hidden /> {t("security.demoOnly2fa")}
              </p>
            )}
            {setup && (
              <div className="ux-result st-mfa-setup">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated locally */}
                <img src={setup.qr} alt={t("security.qrAlt")} width={180} height={180} />
                <div className="ux-form">
                  <p style={{ fontSize: 13, margin: 0 }}>{t("security.scanQr")}</p>
                  <div>
                    <p className="mute" style={{ fontSize: 12, margin: 0 }}>
                      {t("security.orKey")}
                    </p>
                    <p className="code" style={{ margin: "4px 0 0", wordBreak: "break-all" }} dir="ltr">
                      {setup.secret}
                    </p>
                  </div>
                  <div className="ux-inline">
                    <label>
                      {t("security.codeLabel")}
                      <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" dir="ltr" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                    </label>
                    <button className="btn" disabled={busy} onClick={confirmSetup}>
                      {t("security.verify")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="card ux-sec" aria-labelledby="st-dev-h">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <MonitorSmartphone size={18} />
              </span>
              <h2 id="st-dev-h">{t("security.sessions")}</h2>
              <div className="ux-pills">
                <button className="ghost sm" onClick={showAddDevice} aria-expanded={!!addQr}>
                  <Plus size={14} aria-hidden /> {t("security.addDevice")}
                </button>
              </div>
            </div>
            {addQr && (
              <div className="ux-result st-mfa-setup">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated locally */}
                <img src={addQr} alt={t("security.addQrAlt")} width={160} height={160} />
                <div className="ux-form">
                  <p style={{ fontSize: 13, margin: 0 }}>{t("security.addSteps")}</p>
                  <div>
                    <button
                      className="ghost sm"
                      onClick={() => {
                        void navigator.clipboard?.writeText(`${window.location.origin}/login`);
                        s.toast(t("security.linkCopied"));
                      }}
                    >
                      {t("security.copyLink")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {live && sessionsUnavailable && (
              <p className="st-demo-warn" style={{ margin: 0 }}>
                <Info size={14} aria-hidden /> {t("security.sessionsNeedUpdate")}
              </p>
            )}
            {live && sessions === null ? (
              <p className="mute" style={{ margin: 0 }}>
                {t("security.loadingSessions")}
              </p>
            ) : deviceRows.length ? (
              <div className="ux-table-wrap">
                <table className="ux-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("security.colDevice")}</th>
                      <th scope="col">{t("security.colLastActive")}</th>
                      <th scope="col" style={{ textAlign: "end" }}>
                        {t("security.colAction")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceRows.map((d) => {
                      const dev = deviceName(d.user_agent);
                      const Icon = dev.mobile ? Smartphone : d.current ? Monitor : Laptop;
                      return (
                        <tr key={d.id}>
                          <td>
                            <span className="ux-actor">
                              <Icon size={16} aria-hidden /> <b>{dev.name || t("security.unknownDevice")}</b>
                            </span>
                            {(d.ip || d.aal === "aal2") && (
                              <p className="mute" style={{ fontSize: 12, margin: "2px 0 0" }}>
                                {d.ip ? <span dir="ltr">{d.ip}</span> : null}
                                {d.ip && d.aal === "aal2" ? " · " : ""}
                                {d.aal === "aal2" ? t("security.with2fa") : ""}
                              </p>
                            )}
                          </td>
                          <td className="mute" style={{ whiteSpace: "nowrap" }}>
                            {when(d.last_active)}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {d.current ? (
                              <span className="st-pill">{t("common.current")}</span>
                            ) : (
                              <button className="ghost sm" onClick={() => signOutSession(d.id)}>
                                <LogOut size={14} aria-hidden /> {t("security.signOutDevice")}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
            {live && (sessions?.length ?? 0) > 1 && (
              <div className="ux-actions">
                <button className="ghost danger" onClick={signOutOthers}>
                  <LogOut size={16} aria-hidden /> {t("security.signOutOthers")}
                </button>
              </div>
            )}
            <p className="mute st-foot" style={{ marginTop: 0 }}>
              <Info size={14} aria-hidden /> {live ? t("security.sessionsNoteReal") : t("security.sessionsNote")}
            </p>
          </section>

          <section className="card" aria-labelledby="st-pw-h">
            <div className="st-row" style={{ padding: 0 }}>
              <span className="ux-icon sm" aria-hidden>
                <KeyRound size={18} />
              </span>
              <div className="st-row-main">
                <h2 id="st-pw-h" style={{ margin: 0, fontSize: 17 }}>
                  {t("security.passwordTitle")}
                </h2>
                <p className="mute">{hasPassword ? t("security.passwordHint") : t("security.passwordNone")}</p>
              </div>
              <Link className="ghost sm" href="/profile">
                {t("security.passwordChange")} <ChevronRight size={14} aria-hidden className="flip-rtl" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
