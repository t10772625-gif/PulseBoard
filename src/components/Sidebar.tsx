"use client";
import { useEffect, useState, type MouseEvent, type FocusEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, Inbox, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Sun, Users, type LucideIcon } from "lucide-react";
import { useStore, health } from "@/lib/store";
import { ProjectId } from "@/types";
import { Avatar } from "./ui";

const NAV: { href: string; icon: LucideIcon; label: string; match: string }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home", match: "/dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects", match: "/projects" },
  { href: "/day", icon: Sun, label: "My Day", match: "/day" },
  { href: "/inbox", icon: Inbox, label: "Inbox", match: "/inbox" },
  { href: "/team", icon: Users, label: "Team", match: "/team" },
];

type Tip = { label: string; top: number; left: number };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { tasks, notifications, logout, projects } = useStore();
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
        <small>Main</small>
        <nav id="mn">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className={`nav ${pathname.startsWith(n.match) ? "on" : ""}`} aria-label={n.label} {...tipProps(n.label)}>
                <i>
                  <Icon size={18} strokeWidth={2} />
                </i>
                <span className="nav-label">{n.label}</span>
                {n.href === "/inbox" && unread > 0 && <b className="nav-count">{unread}</b>}
              </Link>
            );
          })}
        </nav>
        <small>Projects</small>
        <nav className="plist">
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
          <span {...tipProps("Ali Raza")} style={{ display: "inline-flex" }}>
            <Avatar id="me" />
          </span>
          <span className="who" style={{ flex: 1 }}>
            <b style={{ display: "block" }}>Ali Raza</b>
            <span style={{ color: "#7F96AA" }}>Workspace owner</span>
          </span>
          <button
            className="logout-btn"
            aria-label="Log out"
            style={{ color: "#BFD0DD", fontSize: 12 }}
            {...tipProps("Log out")}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut size={15} />
            <span className="logout-text">Log out</span>
          </button>
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
