import {
  Bell,
  CalendarClock,
  CalendarDays,
  GitBranch,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Mail,
  MailPlus,
  MessageSquare,
  Plug,
  Repeat,
  Settings,
  Sparkles,
  Upload,
  UserCheck,
  Wand2,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/i18n";
import { SETTINGS_PAGES, type SettingsPage } from "./settings-nav";

// Sidebar groups: a toggle that lists its sub-pages underneath (like Settings).
// The group's base path has no page of its own; it redirects to the first entry.
// Page permissions match by prefix, so every sub-page sits behind the group's
// permission in PAGE_PERMISSION (permissions.ts).
export type SubPage = SettingsPage;
export type NavGroup = { base: string; icon: LucideIcon; labelKey: MessageKey; pages: SubPage[] };

export const AI_PAGES: SubPage[] = [
  { href: "/ai/create", icon: Wand2, labelKey: "aiNav.create" },
  { href: "/ai/suggestions", icon: Lightbulb, labelKey: "aiNav.suggestions" },
  { href: "/ai/planning", icon: CalendarClock, labelKey: "aiNav.planning" },
  { href: "/ai/assign", icon: UserCheck, labelKey: "aiNav.assign" },
  { href: "/ai/meetings", icon: CalendarDays, labelKey: "aiNav.meetings" },
];

export const AUTOMATION_PAGES: SubPage[] = [
  { href: "/automations/rules", icon: ListChecks, labelKey: "autoNav.rules" },
  { href: "/automations/webhooks", icon: Webhook, labelKey: "autoNav.webhooks" },
  { href: "/automations/notifications", icon: Bell, labelKey: "autoNav.notifications" },
  { href: "/automations/email-templates", icon: MailPlus, labelKey: "autoNav.emailTemplates" },
  { href: "/automations/recurring", icon: Repeat, labelKey: "autoNav.recurring" },
];

export const INTEGRATION_PAGES: SubPage[] = [
  { href: "/integrations/apps", icon: LayoutGrid, labelKey: "intNav.apps" },
  { href: "/integrations/slack", icon: MessageSquare, labelKey: "intNav.slack" },
  { href: "/integrations/email", icon: Mail, labelKey: "intNav.email" },
  { href: "/integrations/github", icon: GitBranch, labelKey: "intNav.github" },
  { href: "/integrations/calendar", icon: CalendarDays, labelKey: "intNav.calendar" },
  { href: "/integrations/import", icon: Upload, labelKey: "intNav.import" },
];

export const AI_GROUP: NavGroup = { base: "/ai", icon: Sparkles, labelKey: "nav.ai", pages: AI_PAGES };
export const AUTOMATION_GROUP: NavGroup = { base: "/automations", icon: Workflow, labelKey: "nav.automations", pages: AUTOMATION_PAGES };
export const INTEGRATION_GROUP: NavGroup = { base: "/integrations", icon: Plug, labelKey: "nav.integrations", pages: INTEGRATION_PAGES };
export const SETTINGS_GROUP: NavGroup = { base: "/settings", icon: Settings, labelKey: "nav.settings", pages: SETTINGS_PAGES };

export const firstPage = (g: NavGroup) => g.pages[0].href;
