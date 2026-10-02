"use client";
import { Languages } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";
import { enabledLocales } from "@/i18n";
import Dropdown from "./Dropdown";

// Compact language picker for pages outside the app (sign-in, pricing).
// Inside the app the same choice lives in Settings → Language.
// Uses the app's themed dropdown: a native <select> list is drawn by the OS in
// white, which was unreadable on the dark sign-in page.
export default function LanguageSwitcher() {
  const { language, setLanguage } = useStore();
  const { t } = useT();
  const locales = enabledLocales();
  if (locales.length < 2) return null;
  return (
    <span className="lang-switch" title={t("lang.title")}>
      <Languages size={15} aria-hidden />
      <span className="sr">{t("lang.title")}</span>
      <Dropdown
        value={language}
        onChange={setLanguage}
        options={locales.map((l) => ({
          value: l.code,
          label: (
            <span lang={l.code} dir={l.dir}>
              {l.nativeName}
            </span>
          ),
        }))}
      />
    </span>
  );
}
