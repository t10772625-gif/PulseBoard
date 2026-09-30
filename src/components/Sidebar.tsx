"use client";
import { useEffect, useState, type MouseEvent, type FocusEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  Briefcase,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Sparkles,
  Sun,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useStore, health } from "@/lib/store";
import { pagePermissionFor } from "@/lib/permissions";
import { ProjectId } from "@/types";
import { Avatar } from "./ui";

type NavItem = { href: string; icon: LucideIcon; label: string; ur: string; match: string };

const NAV: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home", ur: "ہوم", match: "/dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects", ur: "پروجیکٹس", match: "/projects" },
  { href: "/day", icon: Sun, label: "My Day", ur: "میرا دن", match: "/day" },
  { href: "/inbox", icon: Inbox, label: "Inbox", ur: "ان باکس", match: "/inbox" },
  { href: "/team", icon: Users, label: "Team", ur: "ٹیم", match: "/team" },
];

const WORKSPACE: NavItem[] = [
  { href: "/ai", icon: Sparkles, label: "AI assistant", ur: "اے آئی", match: "/ai" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", ur: "تجزیہ", match: "/analytics" },
  { href: "/clients", icon: Briefcase, label: "Clients", ur: "کلائنٹس", match: "/clients" },
  { href: "/automations", icon: Workflow, label: "Automations", ur: "آٹومیشن", match: "/automations" },
  { href: "/integrations", icon: Plug, label: "Integrations", ur: "انٹیگریشنز", match: "/integrations" },
  { href: "/archive", icon: Archive, label: "Archive", ur: "آرکائیو", match: "/archive" },
];

type Tip = { label: string; top: number; left: number };

export default function Sidebar() {
  const pathname = usePathname();
  const { tasks, notifications, projects, language, allowed, members, viewAsRole, workspaceName } = useStore();
  // RBAC: only show pages this role may open
  const visible = (n: NavItem) => { const p = pagePermissionFor(n.href); return !p || allowed(p); };
  const me = members.me;
  const unread = notifications.filter((n) => n.unread).length;
  const [collapsed, setCollapsed] = useState(false);
  // Rendered position: fixed so .side-scroll's overflow doesn't clip it
  const [tip, setTip] = useState<Tip | null>(null);

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
    const label = language === "ur" ? n.ur : n.label;
    return (
      <Link key={n.href} href={n.href} className={`nav ${pathname.startsWith(n.match) ? "on" : ""}`} aria-label={n.label} {...tipProps(label)}>
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
      <button className="side-collapse" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleCollapsed}>
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>
      <div className="side-scroll">
        <div className="logo">
          <b></b>
          <span className="logo-text">PulseBoard</span>
        </div>
        <small>{language === "ur" ? "مین" : "Main"}</small>
        <nav id="mn">{NAV.filter(visible).map(renderItem)}</nav>
        {WORKSPACE.some(visible) && <small>{language === "ur" ? "ورک اسپیس" : "Workspace"}</small>}
        <nav>{WORKSPACE.filter(visible).map(renderItem)}</nav>
        {allowed("page.projects") && <small>{language === "ur" ? "پروجیکٹس" : "Projects"}</small>}
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
          <span {...tipProps(me?.name ?? "You")} style={{ display: "inline-flex" }}>
            <Avatar id="me" />
          </span>
          <Link href="/profile" className="who" style={{ flex: 1, minWidth: 0, color: "inherit" }} aria-label="Your profile">
            <b style={{ display: "block" }}>{me?.name ?? "You"}</b>
            <span style={{ color: "#7F96AA" }}>
              {me?.role ?? "Member"}
              {viewAsRole !== me?.role && ` · viewing as ${viewAsRole}`} · {workspaceName}
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
