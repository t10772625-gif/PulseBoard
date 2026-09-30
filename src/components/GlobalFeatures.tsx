"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, liveTrackedSeconds } from "@/lib/store";
import { formatDuration } from "@/lib/mock-data";
import { useTick } from "@/lib/useTick";
import Modal from "./Modal";

const SHORTCUTS: [string, string][] = [
  ["C", "Create a task in the current project"],
  ["/", "Search / command palette (also Ctrl K)"],
  ["G then H / P / D / I / T / A", "Go to Home, Projects, My Day, Inbox, Team, Analytics"],
  ["F", "Focus on the open task"],
  ["Shift + click", "Select tasks on the board"],
  ["Delete", "Delete selected tasks (undo available)"],
  ["E", "Archive selected tasks"],
  ["Esc", "Close / clear selection"],
  ["?", "Show this list"],
];

function typing(e: KeyboardEvent) {
  const el = e.target as HTMLElement;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

// App-wide keyboard shortcuts (CORE-07), shortcut help, and focus mode (TIME-03).
// Single-key shortcuts only fire outside text fields, so they never collide with
// typing or with browser shortcuts like Ctrl+N / Ctrl+D.
export default function GlobalFeatures() {
  const router = useRouter();
  const s = useStore();
  const [help, setHelp] = useState(false);
  const [goMode, setGoMode] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
      if (goMode) {
        const dest: Record<string, string> = { h: "/dashboard", p: "/projects", d: "/day", i: "/inbox", t: "/team", a: "/analytics" };
        if (dest[e.key.toLowerCase()]) router.push(dest[e.key.toLowerCase()]);
        setGoMode(false);
        return;
      }
      if (e.key === "?") setHelp(true);
      else if (e.key === "/") {
        e.preventDefault();
        s.openPalette();
      } else if (e.key.toLowerCase() === "c" && s.allowed("task.create")) {
        e.preventDefault();
        s.openNewTaskModal(s.currentProjectId);
      } else if (e.key.toLowerCase() === "g") setGoMode(true);
      else if (e.key.toLowerCase() === "f" && s.openTaskId) s.setFocusTaskId(s.openTaskId);
      else if (e.key === "Delete" && s.selectedIds.length && s.allowed("task.delete")) s.deleteTasks(s.selectedIds);
      else if (e.key.toLowerCase() === "e" && s.selectedIds.length && s.allowed("task.archive")) s.archiveTasks(s.selectedIds);
      else if (e.key === "Escape") {
        s.clearSelection();
        s.setFocusTaskId(null);
        setHelp(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [s, router, goMode]);

  return (
    <>
      {help && (
        <Modal title="Keyboard shortcuts" onClose={() => setHelp(false)}>
          <div className="kbd-grid">
            {SHORTCUTS.map(([k, d]) => (
              <div key={k} style={{ display: "contents" }}>
                <kbd>{k}</kbd>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {s.focusTaskId && <FocusMode />}
    </>
  );
}

function FocusMode() {
  const { focusTaskId, setFocusTaskId, tasks, projects, toggleSubtask, tracking, startTracking, pauseTracking, setDnd, dndUntil, timerSeconds, timerRunning, toggleTimer, resetTimer } = useStore();
  const task = tasks.find((t) => t.id === focusTaskId);
  useTick(!!tracking && tracking.status === "running");
  useEffect(() => {
    // Entering focus mode mutes notifications for an hour (TIME-04) unless already muted
    if (!dndUntil) setDnd(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!task) return null;
  const mm = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const ss = String(timerSeconds % 60).padStart(2, "0");
  const running = tracking?.taskId === task.id && tracking.status === "running";
  return (
    <div className="focus-ov" role="dialog" aria-modal="true" aria-label="Focus mode">
      <div className="card focus-card">
        <div className="meta">
          <span className="chip" style={{ color: projects[task.projectId].color }}>
            {projects[task.projectId].name}
          </span>
          <button className="ghost" onClick={() => setFocusTaskId(null)}>
            Exit focus (Esc)
          </button>
        </div>
        <h1 style={{ margin: "14px 0" }}>{task.title}</h1>
        {task.description && <p className="mute">{task.description}</p>}
        <div style={{ margin: "16px 0" }}>
          {task.subtasks.map((st, i) => (
            <label key={i} className={`sub ${st[1] ? "dn" : ""}`} style={{ display: "flex" }}>
              <input type="checkbox" checked={!!st[1]} onChange={() => toggleSubtask(task.id, i)} />
              <span>{st[0]}</span>
            </label>
          ))}
        </div>
        <div className="pill-row">
          <span className="timer" style={{ fontSize: 34 }}>
            {mm}:{ss}
          </span>
          <button className="btn" onClick={toggleTimer}>
            {timerRunning ? "Pause" : "Start 25-min focus"}
          </button>
          <button className="ghost" onClick={() => resetTimer(1500)}>
            Reset
          </button>
          <button className="ghost" onClick={() => (running ? pauseTracking() : startTracking(task.id))}>
            {running ? "⏸ Stop tracking" : "▶ Track time"} · {formatDuration(liveTrackedSeconds(task, tracking))}
          </button>
        </div>
        <p className="mute" style={{ fontSize: 12, marginTop: 14 }}>
          🔕 Notifications are muted while you focus. Everything else is hidden.
        </p>
      </div>
    </div>
  );
}
