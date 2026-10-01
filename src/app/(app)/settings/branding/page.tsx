"use client";
import { useStore } from "@/lib/store";
import Gate from "@/components/Gate";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";

export default function BrandingSettings() {
  const s = useStore();
  const { t } = useT();

  return (
    <>
      <SettingsHeader title={t("branding.title")} hint={t("branding.hint")} />
      <div className="card">
        <h2>{t("branding.cardTitle")}</h2>
        <Gate id="ADV-02">
          <div className="f2">
            <label>
              {t("branding.name")}
              <input value={s.branding.name} onChange={(e) => s.setBranding({ name: e.target.value })} />
            </label>
            <label>
              {t("branding.color")}
              <input type="color" value={s.branding.color} onChange={(e) => s.setBranding({ color: e.target.value })} />
            </label>
          </div>
          <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>{t("branding.usedOn")}</p>
          <p className="mute" style={{ fontSize: 12, marginTop: 2 }}>{t("branding.sessionNote")}</p>
        </Gate>
        <h3 style={{ marginTop: 14 }}>{t("branding.domain")}</h3>
        <Gate id="ADV-01">
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="clients.youragency.com" dir="ltr" value={s.branding.domain} onChange={(e) => s.setBranding({ domain: e.target.value.trim().toLowerCase(), domainStatus: "none" })} />
            <button
              className="ghost sm"
              onClick={() => {
                if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s.branding.domain)) return s.toast(t("branding.invalidDomain"));
                s.setBranding({ domainStatus: "pending" });
              }}
            >
              {t("branding.verify")}
            </button>
          </div>
          {s.branding.domainStatus === "pending" && (
            <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>
              {t("branding.cname", { record: `${s.branding.domain} → portals.pulseboard.app` })}
            </p>
          )}
        </Gate>
      </div>
    </>
  );
}
