"use client";
import { useEffect, useState } from "react";
import { Check, Gauge, Info, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { serverSetup } from "@/lib/integrations";
import SettingsHeader from "@/components/SettingsHeader";
import { Switch } from "@/components/ui";
import Modal from "@/components/Modal";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const SENT: MessageKey[] = ["aiSettings.sent1", "aiSettings.sent2"];
const NEVER: MessageKey[] = ["aiSettings.never1", "aiSettings.never2", "aiSettings.never3"];

// Workspace AI opt-in (Google Gemini). Off by default. Only an Admin can turn it on,
// after reading what is sent and that the free tier may use it to improve Google's
// products (CLAUDE.md §12). The database records who turned it on and when.
export default function AiSettings() {
  const { aiEnabled, setAiEnabled, myRole, realMode, aiUses, plan, toast } = useStore();
  const { t, fmt } = useT();
  const [configured, setConfigured] = useState<boolean | null>(null);
  // Turning AI on asks first, in the app's own dialog (not the browser's confirm box)
  const [confirmOn, setConfirmOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const apply = async (v: boolean) => {
    setSaving(true);
    const ok = await setAiEnabled(v);
    setSaving(false);
    if (ok) toast(v ? t("aiSettings.turnedOn") : t("aiSettings.turnedOff"));
    return ok;
  };
  useEffect(() => {
    if (realMode) void serverSetup().then((s) => setConfigured(!!s?.ai));
  }, [realMode]);
  const cap = PLANS[plan].aiPerMonth;
  const notSetUp = realMode && configured === false;
  const status = notSetUp ? "setup" : aiEnabled ? "connected" : "planned";
  const statusText = notSetUp ? t("aiSettings.stSetup") : aiEnabled ? t("aiSettings.stOn") : t("aiSettings.stOff");

  return (
    <>
      <SettingsHeader title={t("aiSettings.title")} hint={t("aiSettings.hint")} />
      <div className="ux-page">
        <section className="card ux-sec" aria-labelledby="ais-provider">
          <div className="ux-sec-head">
            <span className="ux-icon sm" aria-hidden>
              <Sparkles size={18} />
            </span>
            <h2 id="ais-provider">{t("aiSettings.provider")}</h2>
            <div className="ux-pills">
              <span className={`int-st ${status}`}>{statusText}</span>
            </div>
          </div>
          <div className="ux-rows">
            <div className="st-row">
              <div className="st-row-main">
                <b>{t("aiSettings.useGemini")}</b>
                <p className="mute">{aiEnabled ? t("aiSettings.onHint") : t("aiSettings.offHint")}</p>
              </div>
              <Switch
                label={t("aiSettings.useGemini")}
                checked={aiEnabled}
                disabled={myRole !== "Admin" || notSetUp}
                onChange={(v) => {
                  if (v) setConfirmOn(true);
                  else void apply(false);
                }}
              />
            </div>
          </div>
          {notSetUp && (
            <p className="st-demo-warn" style={{ margin: 0 }}>
              <TriangleAlert size={14} aria-hidden /> {t("aiSettings.notConfigured")}
            </p>
          )}
          <p className="st-demo-warn" style={{ margin: 0 }}>
            <TriangleAlert size={14} aria-hidden /> {t("aiSettings.freeTierWarn")}
          </p>
          {myRole !== "Admin" && (
            <p className="mute st-foot" style={{ marginTop: 0 }}>
              <Info size={14} aria-hidden /> {t("aiSettings.adminOnly")}
            </p>
          )}
        </section>

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="ais-usage">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <Gauge size={18} />
              </span>
              <h2 id="ais-usage">{t("aiSettings.usage")}</h2>
            </div>
            <div className="ux-tiles">
              <div className="ux-tile">
                <small className="mute">{t("aiSettings.tileUsed")}</small>
                <b>{fmt.number(aiUses)}</b>
              </div>
              <div className="ux-tile">
                <small className="mute">{t("aiSettings.tileLimit")}</small>
                <b>{fmt.number(cap)}</b>
              </div>
              <div className="ux-tile">
                <small className="mute">{t("aiSettings.tileLeft")}</small>
                <b>{fmt.number(Math.max(0, cap - aiUses))}</b>
              </div>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 12 }}>
              {t("aiSettings.usageHint")}
            </p>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {t("aiSettings.ruleBased")}
            </p>
          </section>

          <section className="card ux-sec" aria-labelledby="ais-data">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <ShieldCheck size={18} />
              </span>
              <h2 id="ais-data">{t("aiSettings.dataTitle")}</h2>
            </div>
            <ul className="ais-list">
              {SENT.map((k) => (
                <li key={k}>
                  <Check size={14} aria-hidden className="ok" /> <span>{t(k)}</span>
                </li>
              ))}
              {NEVER.map((k) => (
                <li key={k}>
                  <X size={14} aria-hidden className="no" /> <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {t("aiSettings.whatIsSent")}
            </p>
          </section>
        </div>
      </div>
      {confirmOn && (
        <Modal title={t("aiSettings.confirmTitle")} onClose={() => setConfirmOn(false)}>
          <div className="ux-form">
            <p style={{ margin: 0 }}>{t("aiSettings.confirmOn")}</p>
            <ul className="ais-list">
              {SENT.map((k) => (
                <li key={k}>
                  <Check size={14} aria-hidden className="ok" /> <span>{t(k)}</span>
                </li>
              ))}
              {NEVER.map((k) => (
                <li key={k}>
                  <X size={14} aria-hidden className="no" /> <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <p className="st-demo-warn" style={{ margin: 0 }}>
              <TriangleAlert size={14} aria-hidden /> {t("aiSettings.freeTierWarn")}
            </p>
            <div className="ux-actions">
              <button className="ghost" onClick={() => setConfirmOn(false)} disabled={saving}>
                {t("common.cancel")}
              </button>
              <button
                className="btn"
                disabled={saving}
                onClick={async () => {
                  if (await apply(true)) setConfirmOn(false);
                }}
              >
                <Sparkles size={16} aria-hidden /> {saving ? t("auth.wait") : t("aiSettings.confirmYes")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
