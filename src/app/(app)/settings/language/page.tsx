"use client";
import { useStore } from "@/lib/store";
import Dropdown from "@/components/Dropdown";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";
import { enabledLocales, localeInfo } from "@/i18n";

// The list comes from src/i18n/locales.json: only enabled languages are offered,
// so a language added for translation stays hidden until it passes review.
export default function LanguageSettings() {
  const s = useStore();
  const { t, fmt } = useT();
  const current = localeInfo(s.language);
  const sample = new Date();

  return (
    <>
      <SettingsHeader title={t("lang.title")} hint={t("lang.hint")} />
      <div className="card">
        <h2>{t("lang.choose")}</h2>
        <Dropdown
          value={s.language}
          onChange={s.setLanguage}
          options={enabledLocales().map((l) => ({
            value: l.code,
            label: `${l.nativeName}${l.nativeName !== l.name ? ` (${l.name})` : ""} · ${l.dir === "rtl" ? t("lang.rtl") : t("lang.ltr")}`,
          }))}
        />
        {current.qa !== "approved" && (
          <p style={{ fontSize: 13, marginTop: 10 }}>
            <span className="chip">{t(`lang.qa.${current.qa}`)}</span> <span className="mute">{t("lang.reviewNote")}</span>
          </p>
        )}
        <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>{t("lang.savedBrowser")}</p>
        <p className="mute" style={{ fontSize: 12, marginTop: 2 }}>{t("lang.userContent")}</p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>{t("lang.formatPreview")}</h2>
        <table className="tbl">
          <tbody>
            <tr>
              <th>{t("lang.formatDate")}</th>
              <td>{fmt.date(sample, { dateStyle: "full" })}</td>
            </tr>
            <tr>
              <th>{t("lang.formatTime")}</th>
              <td>{fmt.time(sample)}</td>
            </tr>
            <tr>
              <th>{t("lang.formatNumber")}</th>
              <td>{fmt.number(1234567.89)}</td>
            </tr>
            <tr>
              <th>{t("lang.formatCurrency")}</th>
              <td>{fmt.currency(18)}</td>
            </tr>
            <tr>
              <th>{t("common.tasks")}</th>
              <td>
                {[0, 1, 5].map((n) => t("lang.formatPlural", { n })).join(" · ")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
