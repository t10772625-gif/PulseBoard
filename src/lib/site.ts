import { Activity, Briefcase, CalendarRange, ShieldCheck, Sparkles, Timer, Workflow, LayoutGrid, type LucideIcon } from "lucide-react";
import type { MessageKey } from "@/i18n";
import type { FeatureStatus } from "./pricing";
import type { Plan } from "@/types";

// Core features for the public website (landing, /features, /features/[slug]).
// Every point carries its honest build status (same meaning as on /pricing):
// "app" = built and usable today, "preview" = demo / simulated / needs setup or a
// pending database change, "planned" = not built. Keep in sync with the real app.

export type SitePoint = { text: MessageKey; status: FeatureStatus; plan?: Plan };
export type SiteFeature = { slug: string; icon: LucideIcon; tone: string; title: MessageKey; lead: MessageKey; points: SitePoint[] };

export const SITE_FEATURES: SiteFeature[] = [
  {
    slug: "boards",
    icon: LayoutGrid,
    tone: "#12B5A0",
    title: "site.f.boards.title",
    lead: "site.f.boards.lead",
    points: [
      { text: "site.f.boards.p1", status: "app" },
      { text: "site.f.boards.p2", status: "app" },
      { text: "site.f.boards.p3", status: "app" },
      { text: "site.f.boards.p4", status: "app" },
      { text: "site.f.boards.p5", status: "app" },
      { text: "site.f.boards.p6", status: "preview" },
    ],
  },
  {
    slug: "views",
    icon: CalendarRange,
    tone: "#3A86FF",
    title: "site.f.views.title",
    lead: "site.f.views.lead",
    points: [
      { text: "site.f.views.p1", status: "app" },
      { text: "site.f.views.p2", status: "app", plan: "pro" },
      { text: "site.f.views.p3", status: "app", plan: "enterprise" },
      { text: "site.f.views.p4", status: "app", plan: "pro" },
      { text: "site.f.views.p5", status: "app" },
    ],
  },
  {
    slug: "team",
    icon: ShieldCheck,
    tone: "#9B6CFF",
    title: "site.f.team.title",
    lead: "site.f.team.lead",
    points: [
      { text: "site.f.team.p1", status: "app" },
      { text: "site.f.team.p2", status: "app", plan: "enterprise" },
      { text: "site.f.team.p3", status: "preview" },
      { text: "site.f.team.p4", status: "app" },
      { text: "site.f.team.p5", status: "preview" },
    ],
  },
  {
    slug: "automation",
    icon: Workflow,
    tone: "#FF6B57",
    title: "site.f.automation.title",
    lead: "site.f.automation.lead",
    points: [
      { text: "site.f.automation.p1", status: "app", plan: "pro" },
      { text: "site.f.automation.p2", status: "app", plan: "pro" },
      { text: "site.f.automation.p3", status: "app", plan: "pro" },
      { text: "site.f.automation.p4", status: "preview" },
      { text: "site.f.automation.p5", status: "preview" },
    ],
  },
  {
    slug: "analytics",
    icon: Activity,
    tone: "#F0A400",
    title: "site.f.analytics.title",
    lead: "site.f.analytics.lead",
    points: [
      { text: "site.f.analytics.p1", status: "app" },
      { text: "site.f.analytics.p2", status: "app", plan: "pro" },
      { text: "site.f.analytics.p3", status: "app", plan: "pro" },
      { text: "site.f.analytics.p4", status: "app", plan: "pro" },
      { text: "site.f.analytics.p5", status: "preview", plan: "enterprise" },
    ],
  },
  {
    slug: "assistant",
    icon: Sparkles,
    tone: "#12B5A0",
    title: "site.f.assistant.title",
    lead: "site.f.assistant.lead",
    points: [
      { text: "site.f.assistant.p1", status: "app", plan: "pro" },
      { text: "site.f.assistant.p2", status: "app", plan: "pro" },
      { text: "site.f.assistant.p3", status: "app", plan: "enterprise" },
      { text: "site.f.assistant.p4", status: "app", plan: "pro" },
      { text: "site.f.assistant.p5", status: "preview" },
    ],
  },
  {
    slug: "clients",
    icon: Briefcase,
    tone: "#3A86FF",
    title: "site.f.clients.title",
    lead: "site.f.clients.lead",
    points: [
      { text: "site.f.clients.p1", status: "app", plan: "pro" },
      { text: "site.f.clients.p2", status: "app", plan: "enterprise" },
      { text: "site.f.clients.p3", status: "preview" },
      { text: "site.f.clients.p4", status: "preview" },
    ],
  },
  {
    slug: "focus",
    icon: Timer,
    tone: "#9B6CFF",
    title: "site.f.focus.title",
    lead: "site.f.focus.lead",
    points: [
      { text: "site.f.focus.p1", status: "app", plan: "pro" },
      { text: "site.f.focus.p2", status: "app" },
      { text: "site.f.focus.p3", status: "app" },
      { text: "site.f.focus.p4", status: "app" },
    ],
  },
];

export const featureBySlug = (slug: string) => SITE_FEATURES.find((f) => f.slug === slug);

export const SITE_NAV: { href: string; label: MessageKey }[] = [
  { href: "/features", label: "site.nav.features" },
  { href: "/pricing", label: "site.nav.pricing" },
  { href: "/about", label: "site.nav.about" },
  { href: "/contact", label: "site.nav.contact" },
];
