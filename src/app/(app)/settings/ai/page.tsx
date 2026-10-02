"use client";
import { useEffect, useState } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { serverSetup } from "@/lib/integrations";
import SettingsHeader from "@/components/SettingsHeader";
import { SettingRow, Switch } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

// Workspace AI opt-in (Google Gemini). Off by default. Only an Admin can turn it on,
// after reading what is sent and that the free tier may use it to improve Google's
// products (CLAUDE.md §12). The database records who turned it on and when.
export default function AiSettings() {
  const { aiEnabled, setAiEnabled, myRole, realMode, aiUses, plan, toast } = useStore();
  const { t, fmt } = useT();
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    if (realMode) void serverSetup().then((s) => setConfigured(!!s?.ai));
  }, [realMode]);
  const cap = PLANS[plan].aiPerMonth;

  return (
    <>
      <SettingsHeader title={t("aiSettings.title")} hint={t("aiSettings.hint")} />
      <div className="grid g2">
        <div className="card">
          <h2>{t("aiSettings.provider")}</h2>
          <SettingRow title={t("aiSettings.useGemini")} hint={aiEnabled ? t("aiSettings.onHint") : t("aiSettings.offHint")}>
            <Switch
              label={t("aiSettings.useGemini")}
              checked={aiEnabled}
              disabled={myRole !== "Admin" || (realMode && configured === false)}
              onChange={async (v) => {
                if (v && !window.confirm(t("aiSettings.confirmOn"))) return;
                if (await setAiEnabled(v)) toast(v ? t("aiSettings.turnedOn") : t("aiSettings.turnedOff"));
              }}
            />
          </SettingRow>
          {realMode && configured === false && (
            <p className="st-demo-warn">
              <TriangleAlert size={14} aria-hidden /> {t("aiSettings.notConfigured")}
            </p>
          )}
          {myRole !== "Admin" && <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>{t("aiSettings.adminOnly")}</p>}
          <p className="st-demo-warn">
            <TriangleAlert size={14} aria-hidden /> {t("aiSettings.freeTierWarn")}
          </p>
          <p className="mute st-foot" style={{ marginTop: 10 }}>
            <Info size={14} aria-hidden /> {t("aiSettings.whatIsSent")}
          </p>
        </div>
        <div className="card">
          <h2>{t("aiSettings.usage")}</h2>
          <p className="stat">
            {fmt.number(aiUses)} <span className="mute" style={{ fontSize: 14 }}>/ {fmt.number(cap)}</span>
          </p>
          <p className="mute" style={{ fontSize: 12 }}>{t("aiSettings.usageHint")}</p>
          <p className="mute st-foot" style={{ marginTop: 10 }}>
            <Info size={14} aria-hidden /> {t("aiSettings.ruleBased")}
          </p>
        </div>
      </div>
    </>
  );
}
