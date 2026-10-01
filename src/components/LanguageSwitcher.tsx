"use client";
import { Languages } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";
import { enabledLocales } from "@/i18n";

// Compact language picker for pages outside the app (sign-in, pricing).
// Inside the app the same choice lives in Settings → Language.
export default function LanguageSwitcher() {
  const { language, setLanguage } = useStore();
  const { t } = useT();
  const locales = enabledLocales();
  if (locales.length < 2) return null;
  return (
    <label className="lang-switch" title={t("lang.title")}>
      <Languages size={15} aria-hidden />
      <span className="sr">{t("lang.title")}</span>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {locales.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
