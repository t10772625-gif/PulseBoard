import { Braces, CreditCard, Database, Languages, Lock, Palette, ScrollText, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { MessageKey } from "@/i18n";

// Settings sub-pages, in sidebar order. /settings itself has no page: it opens the
// first entry. All of them sit behind the "page.settings" permission (see
// PAGE_PERMISSION in permissions.ts); each page keeps its own action checks.
export type SettingsPage = { href: string; icon: LucideIcon; labelKey: MessageKey };

export const SETTINGS_PAGES: SettingsPage[] = [
  { href: "/settings/plan", icon: CreditCard, labelKey: "settingsNav.plan" },
  { href: "/settings/permissions", icon: ShieldCheck, labelKey: "settingsNav.permissions" },
  { href: "/settings/security", icon: Lock, labelKey: "settingsNav.security" },
  { href: "/settings/custom-fields", icon: SlidersHorizontal, labelKey: "settingsNav.customFields" },
  { href: "/settings/branding", icon: Palette, labelKey: "settingsNav.branding" },
  { href: "/settings/language", icon: Languages, labelKey: "settingsNav.language" },
  { href: "/settings/audit", icon: ScrollText, labelKey: "settingsNav.audit" },
  { href: "/settings/api", icon: Braces, labelKey: "settingsNav.api" },
  { href: "/settings/data", icon: Database, labelKey: "settingsNav.data" },
];

export const SETTINGS_HOME = SETTINGS_PAGES[0].href;
