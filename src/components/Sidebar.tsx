"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStore, health } from "@/lib/store";
import { ProjectId } from "@/types";
import { Avatar } from "./ui";

const NAV = [
  { href: "/dashboard", icon: "◧", label: "Home", match: "/dashboard" },
  { href: "/projects", icon: "▤", label: "Projects", match: "/projects" },
  { href: "/day", icon: "☀", label: "My Day", match: "/day" },
  { href: "/inbox", icon: "✉", label: "Inbox", match: "/inbox" },
  { href: "/team", icon: "☺", label: "Team", match: "/team" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { tasks, notifications, logout, projects } = useStore();
  const unread = notifications.filter((n) => n.unread).length;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-browser preference that isn't available during SSR
      setCollapsed(localStorage.getItem("pb_sidebar_collapsed") === "1");
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("pb_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
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
        <nav id="mn">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`nav ${pathname.startsWith(n.match) ? "on" : ""}`} title={n.label}>
              <i>{n.icon}</i>
              <span className="nav-label">{n.label}</span>
              {n.href === "/inbox" && unread > 0 && <b>{unread}</b>}
            </Link>
          ))}
        </nav>
        <small>Your projects</small>
        <nav className="plist">
          {(Object.keys(projects) as ProjectId[]).map((k) => {
            const h = health(k, tasks);
            const active = pathname === `/projects/${k}`;
            return (
              <Link key={k} href={`/projects/${k}`} className={`nav ${active ? "on" : ""}`} title={projects[k].name}>
                <span className="dot" style={{ background: projects[k].color }} />
                <span className="nav-label">{projects[k].name}</span>
                <b style={{ background: h.color }}>{h.score}</b>
              </Link>
            );
          })}
        </nav>
        <div className="me">
          <Avatar id="me" />
          <span className="who" style={{ flex: 1 }}>
            <b style={{ display: "block" }}>Ali Raza</b>
            <span style={{ color: "#7F96AA" }}>Workspace owner</span>
          </span>
          <button
            className="logout-btn"
            style={{ color: "#BFD0DD", fontSize: 12 }}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
