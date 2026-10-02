import { Plan } from "@/types";
import type { MessageKey } from "@/i18n";

// What each plan includes, for the /pricing page and Settings → Plan & billing.
// Prices and limits come from PLANS (plans.ts); this file only describes them.
// All text is a translation key (src/i18n/messages/en.json → "pricing.*").
//
// Every row carries an honest build status (CLAUDE.md §1.2, §12, §25):
//   "app"     – built and usable in the app today (not every path is independently verified yet)
//   "preview" – demo / simulated / saved only in this browser session
//   "planned" – not built yet, or the limit isn't enforced by the server yet
// Update a row's status only when the feature really changes.

export type FeatureStatus = "app" | "preview" | "planned";
// true = included, false = not included, otherwise the key of the cell's text
export type Cell = boolean | MessageKey;

export type PricingRow = {
  label: MessageKey;
  note?: MessageKey;
  basic: Cell;
  pro: Cell;
  enterprise: Cell;
  status: FeatureStatus;
};

export type PricingGroup = { title: MessageKey; rows: PricingRow[] };

export const PLAN_PITCH: Record<Plan, { tagline: MessageKey; highlights: MessageKey[]; badge?: MessageKey }> = {
  basic: {
    tagline: "pricing.basic.tagline",
    highlights: ["pricing.basic.h1", "pricing.basic.h2", "pricing.basic.h3", "pricing.basic.h4"],
  },
  pro: {
    tagline: "pricing.pro.tagline",
    highlights: ["pricing.pro.h1", "pricing.pro.h2", "pricing.pro.h3", "pricing.pro.h4", "pricing.pro.h5"],
    badge: "pricing.pro.badge",
  },
  enterprise: {
    tagline: "pricing.enterprise.tagline",
    highlights: ["pricing.enterprise.h1", "pricing.enterprise.h2", "pricing.enterprise.h3", "pricing.enterprise.h4"],
    badge: "pricing.enterprise.badge",
  },
};

const U: MessageKey = "pricing.cell.unlimited";

export const PRICING_GROUPS: PricingGroup[] = [
  {
    title: "pricing.group.limits",
    rows: [
      { label: "pricing.row.members", basic: U, pro: U, enterprise: U, status: "app" },
      { label: "pricing.row.projects", note: "pricing.note.db", basic: "pricing.cell.one", pro: U, enterprise: U, status: "app" },
      { label: "pricing.row.storage", note: "pricing.note.db", basic: "pricing.cell.gb1", pro: "pricing.cell.gb5", enterprise: "pricing.cell.gb10", status: "app" },
      { label: "pricing.row.assistant", note: "pricing.note.browserCount", basic: false, pro: "pricing.cell.ai200", enterprise: "pricing.cell.ai1000", status: "planned" },
      { label: "pricing.row.support", basic: "pricing.cell.community", pro: "pricing.cell.priority", enterprise: "pricing.cell.allDay", status: "planned" },
    ],
  },
  {
    title: "pricing.group.core",
    rows: [
      { label: "pricing.row.coreItems", basic: true, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.attachments", basic: true, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.bulk", basic: true, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.csv", basic: true, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.archive", basic: true, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.customFields", note: "pricing.note.fieldDefs", basic: false, pro: true, enterprise: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.views",
    rows: [
      { label: "pricing.row.views", basic: false, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.analytics", basic: false, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.auditExport", note: "pricing.note.sessionAudit", basic: false, pro: false, enterprise: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.suggestions",
    rows: [
      { label: "pricing.row.assistantFeatures", note: "pricing.note.ruleBased", basic: false, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.matching", note: "pricing.note.review", basic: false, pro: false, enterprise: true, status: "app" },
    ],
  },
  {
    title: "pricing.group.collab",
    rows: [
      { label: "pricing.row.email", note: "pricing.note.noEmail", basic: false, pro: true, enterprise: true, status: "planned" },
      { label: "pricing.row.share", note: "pricing.note.noSignedOut", basic: "pricing.cell.tasks", pro: "pricing.cell.tasksBoards", enterprise: "pricing.cell.tasksBoards", status: "preview" },
      { label: "pricing.row.portal", basic: false, pro: false, enterprise: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.integrations",
    rows: [
      { label: "pricing.row.integrations", note: "pricing.note.simulated", basic: false, pro: true, enterprise: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.security",
    rows: [
      { label: "pricing.row.roles", note: "pricing.note.db", basic: true, pro: true, enterprise: true, status: "app" },
      { label: "pricing.row.matrix", note: "pricing.note.db", basic: false, pro: false, enterprise: true, status: "app" },
      { label: "pricing.row.twoFactor", basic: true, pro: true, enterprise: true, status: "planned" },
      { label: "pricing.row.whiteLabel", note: "pricing.note.session", basic: false, pro: false, enterprise: true, status: "preview" },
      { label: "pricing.row.domain", basic: false, pro: false, enterprise: true, status: "planned" },
      { label: "pricing.row.backup", basic: false, pro: false, enterprise: true, status: "preview" },
    ],
  },
];

export const PRICING_FAQ: { q: MessageKey; a: MessageKey }[] = [
  { q: "pricing.faq.buyQ", a: "pricing.faq.buyA" },
  { q: "pricing.faq.countQ", a: "pricing.faq.countA" },
  { q: "pricing.faq.aiQ", a: "pricing.faq.aiA" },
  { q: "pricing.faq.statusQ", a: "pricing.faq.statusA" },
  { q: "pricing.faq.dataQ", a: "pricing.faq.dataA" },
];
