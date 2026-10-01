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
  free: Cell;
  pro: Cell;
  legendary: Cell;
  status: FeatureStatus;
};

export type PricingGroup = { title: MessageKey; rows: PricingRow[] };

export const PLAN_PITCH: Record<Plan, { tagline: MessageKey; highlights: MessageKey[]; badge?: MessageKey }> = {
  free: {
    tagline: "pricing.free.tagline",
    highlights: ["pricing.free.h1", "pricing.free.h2", "pricing.free.h3", "pricing.free.h4"],
  },
  pro: {
    tagline: "pricing.pro.tagline",
    highlights: ["pricing.pro.h1", "pricing.pro.h2", "pricing.pro.h3", "pricing.pro.h4", "pricing.pro.h5"],
    badge: "pricing.pro.badge",
  },
  legendary: {
    tagline: "pricing.legendary.tagline",
    highlights: ["pricing.legendary.h1", "pricing.legendary.h2", "pricing.legendary.h3", "pricing.legendary.h4"],
    badge: "pricing.legendary.badge",
  },
};

const U: MessageKey = "pricing.cell.unlimited";

export const PRICING_GROUPS: PricingGroup[] = [
  {
    title: "pricing.group.limits",
    rows: [
      { label: "pricing.row.members", free: U, pro: U, legendary: U, status: "app" },
      { label: "pricing.row.projects", note: "pricing.note.db", free: "pricing.cell.one", pro: U, legendary: U, status: "app" },
      { label: "pricing.row.storage", note: "pricing.note.db", free: "pricing.cell.gb1", pro: "pricing.cell.gb5", legendary: "pricing.cell.gb10", status: "app" },
      { label: "pricing.row.assistant", note: "pricing.note.browserCount", free: false, pro: "pricing.cell.ai200", legendary: "pricing.cell.ai1000", status: "planned" },
      { label: "pricing.row.support", free: "pricing.cell.community", pro: "pricing.cell.priority", legendary: "pricing.cell.allDay", status: "planned" },
    ],
  },
  {
    title: "pricing.group.core",
    rows: [
      { label: "pricing.row.coreItems", free: true, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.attachments", free: true, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.bulk", free: true, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.csv", free: true, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.archive", free: true, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.customFields", note: "pricing.note.fieldDefs", free: false, pro: true, legendary: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.views",
    rows: [
      { label: "pricing.row.views", free: false, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.analytics", free: false, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.auditExport", note: "pricing.note.sessionAudit", free: false, pro: false, legendary: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.suggestions",
    rows: [
      { label: "pricing.row.assistantFeatures", note: "pricing.note.ruleBased", free: false, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.matching", note: "pricing.note.review", free: false, pro: false, legendary: true, status: "app" },
    ],
  },
  {
    title: "pricing.group.collab",
    rows: [
      { label: "pricing.row.email", note: "pricing.note.noEmail", free: false, pro: true, legendary: true, status: "planned" },
      { label: "pricing.row.share", note: "pricing.note.noSignedOut", free: "pricing.cell.tasks", pro: "pricing.cell.tasksBoards", legendary: "pricing.cell.tasksBoards", status: "preview" },
      { label: "pricing.row.portal", free: false, pro: false, legendary: true, status: "preview" },
    ],
  },
  {
    title: "pricing.group.integrations",
    rows: [
      { label: "pricing.row.integrations", note: "pricing.note.simulated", free: false, pro: true, legendary: true, status: "preview" },
      { label: "pricing.row.api", free: false, pro: true, legendary: true, status: "planned" },
    ],
  },
  {
    title: "pricing.group.security",
    rows: [
      { label: "pricing.row.roles", note: "pricing.note.db", free: true, pro: true, legendary: true, status: "app" },
      { label: "pricing.row.matrix", note: "pricing.note.db", free: false, pro: false, legendary: true, status: "app" },
      { label: "pricing.row.twoFactor", free: true, pro: true, legendary: true, status: "planned" },
      { label: "pricing.row.whiteLabel", note: "pricing.note.session", free: false, pro: false, legendary: true, status: "preview" },
      { label: "pricing.row.domain", free: false, pro: false, legendary: true, status: "planned" },
      { label: "pricing.row.backup", free: false, pro: false, legendary: true, status: "preview" },
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
