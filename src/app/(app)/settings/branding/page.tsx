"use client";
import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";

export default function BrandingSettings() {
  const s = useStore();
  const { t } = useT();
  const isAdmin = s.myRole === "Admin";
  const [domain, setDomain] = useState(s.branding.domain);
  const [busy, setBusy] = useState(false);
  const [prefix, setPrefix] = useState(s.taskPrefix);
  const [prefixError, setPrefixError] = useState<string | null>(null);

  async function saveAndCheck() {
    if (domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) return s.toast(t("branding.invalidDomain"));
    setBusy(true);
    const saved = await s.saveDomain(domain);
    if (!saved) {
      setBusy(false);
      return s.toast(t("store.saveFailed"));
    }
    if (!domain || !s.realMode) {
      setBusy(false);
      return s.toast(domain ? t("branding.demoDomain") : t("branding.domainRemoved"));
    }
    const res = await s.checkDomain();
    setBusy(false);
    s.toast(!res ? t("branding.checkFailed") : res.verified ? t("branding.verified") : t("branding.notFound"));
  }

  return (
    <>
      <SettingsHeader title={t("branding.title")} hint={t("branding.hint")} />
      <div className="card" style={{ marginBottom: 14 }}>
        <h2>{t("taskIds.title")}</h2>
        <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
          {t("taskIds.hint", { example: `${prefix || "PB"}-123` })}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input dir="ltr" aria-label={t("taskIds.title")} value={prefix} maxLength={6} style={{ maxWidth: 140, textTransform: "uppercase" }} disabled={!isAdmin} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
          <button
            className="ghost sm"
            disabled={!isAdmin || !prefix || prefix === s.taskPrefix}
            onClick={async () => {
              const err = await s.setTaskPrefix(prefix);
              setPrefixError(err);
              if (!err) s.toast(t("taskIds.saved", { prefix }));
            }}
          >
            {t("common.save")}
          </button>
        </div>
        {prefixError && <p className="warn" role="alert" style={{ marginTop: 6 }}>{prefixError}</p>}
        <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>{t("taskIds.note")}</p>
      </div>
      <div className="card">
        <h2>{t("branding.cardTitle")}</h2>
        <Gate id="ADV-02">
          <div className="f2">
            <label>
              {t("branding.name")}
              <input value={s.branding.name} maxLength={60} disabled={!isAdmin} onChange={(e) => s.setBranding({ name: e.target.value })} />
            </label>
            <label>
              {t("branding.color")}
              <input type="color" value={s.branding.color} disabled={!isAdmin} onChange={(e) => s.setBranding({ color: e.target.value })} />
            </label>
          </div>
          <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>{t("branding.usedOn")}</p>
          <p className="mute" style={{ fontSize: 12, marginTop: 2 }}>{s.realMode ? t("branding.savedNote") : t("branding.sessionNote")}</p>
        </Gate>
        <h3 style={{ marginTop: 14 }}>{t("branding.domain")}</h3>
        <Gate id="ADV-01">
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="clients.youragency.com" dir="ltr" value={domain} disabled={!isAdmin} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} />
            <button className="ghost sm" disabled={!isAdmin || busy} onClick={saveAndCheck}>
              {busy ? t("auth.wait") : t("branding.verify")}
            </button>
          </div>
          {s.branding.domainStatus === "verified" && (
            <p className="approval approved" style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
              <CheckCircle2 size={14} aria-hidden /> {t("branding.verifiedBadge")}
            </p>
          )}
          {s.domainRecord && s.branding.domainStatus !== "verified" && (
            <div className="ai-out" style={{ marginTop: 8 }}>
              <p style={{ fontSize: 13 }}>{t("branding.txtStep")}</p>
              <table className="tbl" style={{ marginTop: 6 }}>
                <tbody>
                  <tr>
                    <th>{t("branding.recType")}</th>
                    <th>{t("branding.recName")}</th>
                    <th>{t("branding.recValue")}</th>
                  </tr>
                  <tr>
                    <td dir="ltr">TXT</td>
                    <td className="code" dir="ltr">{s.domainRecord.name}</td>
                    <td className="code" dir="ltr" style={{ wordBreak: "break-all" }}>{s.domainRecord.value}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <p className="mute st-foot" style={{ marginTop: 8 }}>
            <Info size={14} aria-hidden /> {t("branding.hostingNote")}
          </p>
        </Gate>
      </div>
    </>
  );
}
