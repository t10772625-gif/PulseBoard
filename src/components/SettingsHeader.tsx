"use client";
import type { ReactNode } from "react";
import { useT } from "@/i18n/I18nProvider";

// Shared heading for every Settings sub-page. The Settings group in the sidebar
// is the navigation, so the breadcrumb is plain text (there is no /settings page).
export default function SettingsHeader({ title, hint, actions }: { title: string; hint: string; actions?: ReactNode }) {
  const { t } = useT();
  return (
    <div className="top">
      <div>
        <p className="mute">{t("settings.breadcrumb", { page: title })}</p>
        <h1>{title}</h1>
        <p className="mute">{hint}</p>
      </div>
      {actions}
    </div>
  );
}
