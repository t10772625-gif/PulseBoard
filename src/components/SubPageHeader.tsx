"use client";
import type { ReactNode } from "react";
import { useT } from "@/i18n/I18nProvider";
import type { NavGroup, SubPage } from "@/lib/nav-groups";

// Heading for a sub-page of a sidebar group (AI assistant, Automations,
// Integrations). The sidebar group is the navigation, so the breadcrumb is text.
export default function SubPageHeader({ group, page, hint, actions }: { group: NavGroup; page: SubPage; hint: string; actions?: ReactNode }) {
  const { t } = useT();
  const title = t(page.labelKey);
  return (
    <div className="top">
      <div>
        <p className="mute">{t("nav.crumb", { group: t(group.labelKey), page: title })}</p>
        <h1>{title}</h1>
        <p className="mute">{hint}</p>
      </div>
      {actions}
    </div>
  );
}
