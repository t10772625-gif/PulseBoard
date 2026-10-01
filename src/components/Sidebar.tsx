"use client";
import { useEffect, useState, type MouseEvent, type FocusEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  Briefcase,
  ChevronDown,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Settings,
  Sparkles,
  Sun,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useStore, health } from "@/lib/store";
import { pagePermissionFor } from "@/lib/permissions";
import { SETTINGS_PAGES } from "@/lib/settings-nav";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";
import { ProjectId } from "@/types";
import { Avatar } from "./ui";

type NavItem = { href: string; icon: LucideIcon; labelKey: MessageKey; match: string };

const NAV: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.home", match: "/dashboard" },
  { href: "/projects", icon: FolderKanban, labelKey: "nav.projects", match: "/projects" },
  { href: "/day", icon: Sun, labelKey: "nav.myDay", match: "/day" },
  { href: "/inbox", icon: Inbox, labelKey: "nav.inbox", match: "/inbox" },
  { href: "/team", icon: Users, labelKey: "nav.team", match: "/team" },
];

const WORKSPACE: NavItem[] = [
  { href: "/ai", icon: Sparkles, labelKey: "nav.ai", match: "/ai" },
  { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", match: "/analytics" },
  { href: "/clients", icon: Briefcase, labelKey: "nav.clients", match: "/clients" },
  { href: "/automations", icon: Workflow, labelKey: "nav.automations", match: "/automations" },
  { href: "/integrations", icon: Plug, labelKey: "nav.integrations", match: "/integrations" },
  { href: "/archive", icon: Archive, labelKey: "nav.archive", match: "/archive" },
];

type Tip = { label: string; top: number; left: number };

export default function Sidebar() {
  const pathname = usePathname();
  const { tasks, notifications, projects, allowed, members, viewAsRole, workspaceName } = useStore();
  const { t } = useT();
  // RBAC: only show pages this role may open
  const visible = (n: NavItem) => { const p = pagePermissionFor(n.href); return !p || allowed(p); };
  const me = members.me;
  const unread = notifications.filter((n) => n.unread).length;
  const [collapsed, setCollapsed] = useState(false);
  // Rendered position: fixed so .side-scroll's overflow doesn't clip it
  const [tip, setTip] = useState<Tip | null>(null);
  // Settings is a group, not a page: clicking it shows / hides its sub-pages.
  // It opens by itself whenever you land on a settings page; after that the
  // user's own toggle wins until the next navigation into settings.
  const inSettings = pathname.startsWith("/settings");
  const [settingsToggle, setSettingsToggle] = useState<boolean | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (inSettings) setSettingsToggle(null);
  }
  const settingsExpanded = settingsToggle ?? inSettings;
  const settingsLabel = t("nav.settings");

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-browser preference that isn't available during SSR
      setCollapsed(localStorage.getItem("pb_sidebar_collapsed") === "1");
    } catch {}
  }, []);

  // Sit the collapse toggle on the topbar's bottom border, wherever that ends up
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".main .bar");
    const side = document.querySelector<HTMLElement>(".side");
    if (!bar || !side) return;
    const sync = () => side.style.setProperty("--bar-h", `${bar.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  function toggleCollapsed() {
    setTip(null);
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("pb_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  // Tooltips only matter when labels are hidden
  function tipProps(label: string) {
    const show = (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      if (!collapsed) return;
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ label, top: r.top + r.height / 2, left: r.right + 12 });
    };
    const hide = () => setTip(null);
    return { onMouseEnter: show, onFocus: show, onMouseLeave: hide, onBlur: hide };
  }

  function renderItem(n: NavItem) {
    const Icon = n.icon;
    const label = t(n.labelKey);
    return (
      <Link key={n.href} href={n.href} className={`nav ${pathname.startsWith(n.match) ? "on" : ""}`} aria-label={label} {...tipProps(label)}>
        <i>
          <Icon size={18} strokeWidth={2} />
        </i>
        <span className="nav-label">{label}</span>
        {n.href === "/inbox" && unread > 0 && <b className="nav-count">{unread}</b>}
      </Link>
    );
  }

  return (
    <aside className={`side ${collapsed ? "collapsed" : ""}`}>
      <button className="side-collapse" aria-label={collapsed ? t("nav.expand") : t("nav.collapse")} onClick={toggleCollapsed}>
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>
      <div className="side-scroll">
        <div className="logo">
          <b></b>
          <span className="logo-text">PulseBoard</span>
        </div>
        <small>{t("nav.main")}</small>
        <nav id="mn">{NAV.filter(visible).map(renderItem)}</nav>
        {WORKSPACE.some(visible) && <small>{t("nav.workspace")}</small>}
        <nav>{WORKSPACE.filter(visible).map(renderItem)}</nav>
        {allowed("page.settings") && (
          <nav className="nav-group">
            <button
              type="button"
              className={`nav ${inSettings ? "on-parent" : ""}`}
              aria-expanded={settingsExpanded}
              aria-controls="settings-subnav"
              aria-label={settingsLabel}
              onClick={() => setSettingsToggle(!settingsExpanded)}
              {...tipProps(settingsLabel)}
            >
              <i>
                <Settings size={18} strokeWidth={2} />
              </i>
              <span className="nav-label">{settingsLabel}</span>
              <ChevronDown size={14} className={`nav-chev ${settingsExpanded ? "open" : ""}`} aria-hidden />
            </button>
            {settingsExpanded && (
              <div id="settings-subnav" className="nav-sub">
                {SETTINGS_PAGES.map((sp) => {
                  const Icon = sp.icon;
                  const label = t(sp.labelKey);
                  return (
                    <Link
                      key={sp.href}
                      href={sp.href}
                      className={`nav ${pathname === sp.href || pathname.startsWith(sp.href + "/") ? "on" : ""}`}
                      aria-label={label}
                      aria-current={pathname === sp.href ? "page" : undefined}
                      {...tipProps(label)}
                    >
                      <i>
                        <Icon size={16} strokeWidth={2} />
                      </i>
                      <span className="nav-label">{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        )}
        {allowed("page.projects") && <small>{t("nav.projects")}</small>}
        <nav className="plist" hidden={!allowed("page.projects")}>
          {(Object.keys(projects) as ProjectId[]).map((k) => {
            const h = health(k, tasks);
            const active = pathname === `/projects/${k}`;
            return (
              <Link key={k} href={`/projects/${k}`} className={`nav ${active ? "on" : ""}`} aria-label={projects[k].name} {...tipProps(projects[k].name)}>
                <span className="dot" style={{ background: projects[k].color }} />
                <span className="nav-label">{projects[k].name}</span>
                <b style={{ background: h.color }}>{h.score}</b>
              </Link>
            );
          })}
        </nav>
        <div className="me">
          <span {...tipProps(me?.name ?? t("common.you"))} style={{ display: "inline-flex" }}>
            <Avatar id="me" />
          </span>
          <Link href="/profile" className="who" style={{ flex: 1, minWidth: 0, color: "inherit" }} aria-label={t("nav.yourProfile")}>
            <b style={{ display: "block" }}>{me?.name ?? t("common.you")}</b>
            <span style={{ color: "#7F96AA" }}>
              {t(`role.${me?.role ?? "Member"}`)}
              {viewAsRole !== me?.role && ` · ${t("nav.viewingAs", { role: t(`role.${viewAsRole}`) })}`} · {workspaceName}
            </span>
          </Link>
        </div>
      </div>
      {collapsed && tip && (
        <div className="side-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>
          {tip.label}
        </div>
      )}
    </aside>
  );
}
