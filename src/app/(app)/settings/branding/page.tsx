"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Eye, Globe, Hash, ImagePlus, Info, Palette, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEFAULT_BRAND_NAME, isSafeLogo, readLogo } from "@/lib/branding";
import Gate, { PlanTag } from "@/components/Gate";
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
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const brandName = s.branding.name.trim() || DEFAULT_BRAND_NAME;
  const logo = isSafeLogo(s.branding.logo) ? s.branding.logo : "";

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

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    setLogoError(null);
    const res = await readLogo(file);
    if ("error" in res) return setLogoError(t(res.error));
    s.setBranding({ logo: res.url });
  }

  return (
    <>
      <SettingsHeader title={t("branding.title")} hint={t("branding.hint")} />
      <div className="ux-page">
        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="br-id">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <Palette size={18} />
              </span>
              <h2 id="br-id">{t("branding.identity")}</h2>
              <div className="ux-pills">
                <PlanTag id="ADV-02" />
              </div>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {t("branding.identityHint")}
            </p>
            <Gate id="ADV-02">
              <div className="ux-form">
                <div className="ux-form-2">
                  <label>
                    {t("branding.name")}
                    <input value={s.branding.name} maxLength={60} placeholder={DEFAULT_BRAND_NAME} disabled={!isAdmin} onChange={(e) => s.setBranding({ name: e.target.value })} />
                  </label>
                  <label>
                    {t("branding.color")}
                    <input type="color" value={s.branding.color} disabled={!isAdmin} onChange={(e) => s.setBranding({ color: e.target.value })} />
                  </label>
                </div>
                <div className="br-logo-row">
                  <span className="br-logo-tile" aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element -- checked data: URL */}
                    {logo ? <img src={logo} alt="" width={64} height={64} /> : <b className="br-default-mark" />}
                  </span>
                  <div className="st-row-main">
                    <b>{t("branding.logo")}</b>
                    <p className="mute">{t("branding.logoHint")}</p>
                  </div>
                  <div className="ux-actions">
                    {logo && (
                      <button className="ghost sm danger" disabled={!isAdmin} onClick={() => s.setBranding({ logo: "" })}>
                        <Trash2 size={14} aria-hidden /> {t("branding.logoRemove")}
                      </button>
                    )}
                    <button className="ghost sm" disabled={!isAdmin} onClick={() => fileRef.current?.click()}>
                      <ImagePlus size={14} aria-hidden /> {t("branding.logoUpload")}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(e) => {
                        void pickLogo(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
                {logoError && (
                  <p className="warn" role="alert">
                    {logoError}
                  </p>
                )}
              </div>
              <p className="st-demo-warn" style={{ margin: "12px 0 0" }}>
                <Info size={14} aria-hidden /> {s.realMode ? t("branding.logoNote") : t("branding.sessionNote")}
              </p>
              {!isAdmin && <p className="mute st-foot">{t("branding.savedNote")}</p>}
            </Gate>
          </section>

          <section className="card ux-sec" aria-labelledby="br-preview">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <Eye size={18} />
              </span>
              <h2 id="br-preview">{t("branding.preview")}</h2>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {t("branding.previewHint")}
            </p>
            <div className="br-preview">
              <div className="br-tab">
                {/* eslint-disable-next-line @next/next/no-img-element -- checked data: URL */}
                {logo ? <img src={logo} alt="" width={16} height={16} /> : <b className="br-default-mark sm" />}
                <span>{t("branding.previewTab", { brand: brandName })}</span>
              </div>
              <div className="br-side" style={{ borderTop: `4px solid ${s.branding.color}` }}>
                <div className="logo">
                  {/* eslint-disable-next-line @next/next/no-img-element -- checked data: URL */}
                  {logo ? <img className="logo-img" src={logo} alt="" width={30} height={30} /> : <b></b>}
                  <span className="logo-text">{brandName}</span>
                </div>
                <span className="br-line" />
                <span className="br-line short" />
              </div>
            </div>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {t("branding.usedOn")}
            </p>
          </section>
        </div>

        <section className="card ux-sec" aria-labelledby="br-ids">
          <div className="ux-sec-head">
            <span className="ux-icon sm" aria-hidden>
              <Hash size={18} />
            </span>
            <h2 id="br-ids">{t("taskIds.title")}</h2>
            <div className="ux-pills">
              <span className="task-key" dir="ltr">
                {`${prefix || "PB"}-123`}
              </span>
            </div>
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("taskIds.hint", { example: `${prefix || "PB"}-123` })}
          </p>
          <div className="ux-inline">
            <label style={{ flex: "0 1 220px" }}>
              {t("branding.prefix")}
              <input dir="ltr" value={prefix} maxLength={6} style={{ textTransform: "uppercase" }} disabled={!isAdmin} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
            </label>
            <button
              className="btn"
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
          {prefixError && (
            <p className="warn" role="alert">
              {prefixError}
            </p>
          )}
          <p className="mute st-foot" style={{ marginTop: 0 }}>
            <Info size={14} aria-hidden /> {t("taskIds.note")}
          </p>
        </section>

        <section className="card ux-sec" aria-labelledby="br-domain">
          <div className="ux-sec-head">
            <span className="ux-icon sm" aria-hidden>
              <Globe size={18} />
            </span>
            <h2 id="br-domain">{t("branding.domain")}</h2>
            <div className="ux-pills">
              <PlanTag id="ADV-01" />
              {s.branding.domainStatus === "verified" ? (
                <span className="int-st connected">{t("branding.stVerified")}</span>
              ) : s.branding.domainStatus === "pending" ? (
                <span className="int-st setup">{t("branding.stPending")}</span>
              ) : null}
            </div>
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("branding.domainHint")}
          </p>
          <Gate id="ADV-01">
            <div className="ux-inline">
              <label>
                {t("branding.domainLabel")}
                <input placeholder="clients.youragency.com" dir="ltr" value={domain} disabled={!isAdmin} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} />
              </label>
              <button className="btn" disabled={!isAdmin || busy} onClick={saveAndCheck}>
                {busy ? t("auth.wait") : t("branding.verify")}
              </button>
            </div>
            {s.branding.domainStatus === "verified" && (
              <p className="approval approved" style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
                <CheckCircle2 size={14} aria-hidden /> {t("branding.verifiedBadge")}
              </p>
            )}
            {s.domainRecord && s.branding.domainStatus !== "verified" && (
              <div className="ux-result" style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, margin: 0 }}>{t("branding.txtStep")}</p>
                <div className="ux-table-wrap">
                  <table className="ux-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("branding.recType")}</th>
                        <th scope="col">{t("branding.recName")}</th>
                        <th scope="col">{t("branding.recValue")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td dir="ltr">TXT</td>
                        <td className="code" dir="ltr">
                          {s.domainRecord.name}
                        </td>
                        <td className="code" dir="ltr" style={{ wordBreak: "break-all" }}>
                          {s.domainRecord.value}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {t("branding.hostingNote")}
            </p>
          </Gate>
        </section>
      </div>
    </>
  );
}
