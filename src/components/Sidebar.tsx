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
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useStore, health } from "@/lib/store";
import { pagePermissionFor } from "@/lib/permissions";
import { AI_GROUP, AUTOMATION_GROUP, INTEGRATION_GROUP, SETTINGS_GROUP, type NavGroup } from "@/lib/nav-groups";
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

// Workspace section: plain links and groups (a group lists its sub-pages)
const WORKSPACE: (NavItem | NavGroup)[] = [
  AI_GROUP,
  { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", match: "/analytics" },
  { href: "/clients", icon: Briefcase, labelKey: "nav.clients", match: "/clients" },
  AUTOMATION_GROUP,
  INTEGRATION_GROUP,
  { href: "/archive", icon: Archive, labelKey: "nav.archive", match: "/archive" },
];
const isGroup = (n: NavItem | NavGroup): n is NavGroup => "pages" in n;
const inGroup = (pathname: string, g: NavGroup) => pathname === g.base || pathname.startsWith(g.base + "/");

type Tip = { label: string; top: number; left: number };

export default function Sidebar() {
  const pathname = usePathname();
  const { tasks, notifications, projects, allowed, members, viewAsRole, workspaceName } = useStore();
  const { t } = useT();
  // RBAC: only show pages this role may open
  const visible = (n: NavItem | NavGroup) => { const p = pagePermissionFor(isGroup(n) ? n.base : n.href); return !p || allowed(p); };
  const me = members.me;
  const unread = notifications.filter((n) => n.unread).length;
  const [collapsed, setCollapsed] = useState(false);
  // Rendered position: fixed so .side-scroll's overflow doesn't clip it
  const [tip, setTip] = useState<Tip | null>(null);
  // A group (AI, Automations, Integrations, Settings) is not a page: clicking it
  // shows / hides its sub-pages. It opens by itself whenever you land on one of
  // its pages; after that the user's own toggle wins until the next navigation
  // into that group.
  const [groupToggle, setGroupToggle] = useState<Record<string, boolean>>({});
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    const entered = [...WORKSPACE, SETTINGS_GROUP].find((n): n is NavGroup => isGroup(n) && inGroup(pathname, n));
    if (entered && entered.base in groupToggle) {
      const rest = { ...groupToggle };
      delete rest[entered.base];
      setGroupToggle(rest);
    }
  }
  const expanded = (g: NavGroup) => groupToggle[g.base] ?? inGroup(pathname, g);

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

  // Inside the Workspace <nav> a group is a <div>; Settings stands alone as its own <nav>
  function renderGroup(g: NavGroup, Tag: "nav" | "div" = "div") {
    const Icon = g.icon;
    const label = t(g.labelKey);
    const open = expanded(g);
    const subId = `subnav-${g.base.slice(1)}`;
    return (
      <Tag key={g.base} className="nav-group">
        <button
          type="button"
          className={`nav ${inGroup(pathname, g) ? "on-parent" : ""}`}
          aria-expanded={open}
          aria-controls={subId}
          aria-label={label}
          onClick={() => setGroupToggle((m) => ({ ...m, [g.base]: !open }))}
          {...tipProps(label)}
        >
          <i>
            <Icon size={18} strokeWidth={2} />
          </i>
          <span className="nav-label">{label}</span>
          <ChevronDown size={14} className={`nav-chev ${open ? "open" : ""}`} aria-hidden />
        </button>
        {open && (
          <div id={subId} className="nav-sub">
            {g.pages.map((sp) => {
              const SubIcon = sp.icon;
              const subLabel = t(sp.labelKey);
              return (
                <Link
                  key={sp.href}
                  href={sp.href}
                  className={`nav ${pathname === sp.href || pathname.startsWith(sp.href + "/") ? "on" : ""}`}
                  aria-label={subLabel}
                  aria-current={pathname === sp.href ? "page" : undefined}
                  {...tipProps(subLabel)}
                >
                  <i>
                    <SubIcon size={16} strokeWidth={2} />
                  </i>
                  <span className="nav-label">{subLabel}</span>
                </Link>
              );
            })}
          </div>
        )}
      </Tag>
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
        <nav>{WORKSPACE.filter(visible).map((n) => (isGroup(n) ? renderGroup(n) : renderItem(n)))}</nav>
        {visible(SETTINGS_GROUP) && renderGroup(SETTINGS_GROUP, "nav")}
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
