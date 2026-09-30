"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ProjectId } from "@/types";

type Item = { label: string; icon: string; run: () => void };

export default function CommandPalette() {
  const { paletteOpen, closePalette, openPalette, openDrawer, toggleTheme, currentProjectId, tasks, projects, openNewTaskModal } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems: Item[] = [
    { label: "Go to Home", icon: "⌂", run: () => router.push("/dashboard") },
    { label: "Go to Projects", icon: "▤", run: () => router.push("/projects") },
    { label: "Go to My Day", icon: "☀", run: () => router.push("/day") },
    { label: "Go to Inbox", icon: "✉", run: () => router.push("/inbox") },
    { label: "Go to Team", icon: "☺", run: () => router.push("/team") },
    { label: "Go to AI assistant", icon: "✨", run: () => router.push("/ai") },
    { label: "Go to Analytics", icon: "📊", run: () => router.push("/analytics") },
    { label: "Go to Clients", icon: "💼", run: () => router.push("/clients") },
    { label: "Go to Automations", icon: "⚡", run: () => router.push("/automations") },
    { label: "Go to Integrations", icon: "🔌", run: () => router.push("/integrations") },
    { label: "Go to Archive & trash", icon: "🗄", run: () => router.push("/archive") },
    { label: "Go to Settings", icon: "⚙", run: () => router.push("/settings") },
    { label: "Create a task", icon: "＋", run: () => openNewTaskModal(currentProjectId) },
    { label: "Switch theme", icon: "◐", run: toggleTheme },
    ...(Object.keys(projects) as ProjectId[]).map((k) => ({
      label: "Open " + projects[k].name + " board",
      icon: "▦",
      run: () => router.push(`/projects/${k}`),
    })),
    ...tasks.map((t) => ({ label: "Task: " + t.title, icon: "✓", run: () => openDrawer(t.id) })),
  ];

  const items = allItems.filter((x) => x.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  useEffect(() => {
    if (paletteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset + focus the palette each time it opens
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [paletteOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp selection when the filtered list shrinks
    setIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
      if (e.key === "Escape") closePalette();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openPalette, closePalette]);

  function run(item: Item) {
    closePalette();
    item.run();
  }

  return (
    <>
      <div className={`ov ${paletteOpen ? "on" : ""}`} style={{ zIndex: 40 }} onClick={closePalette}></div>
      <div className={`pal ${paletteOpen ? "" : "hide"}`}>
        <input
          ref={inputRef}
          placeholder="Type a command or task name"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              setIndex((i) => Math.min(i + 1, items.length - 1));
              e.preventDefault();
            }
            if (e.key === "ArrowUp") {
              setIndex((i) => Math.max(i - 1, 0));
              e.preventDefault();
            }
            if (e.key === "Enter" && items[index]) run(items[index]);
          }}
        />
        <div>
          {items.length ? (
            items.map((it, i) => (
              <button key={it.label} className={i === index ? "on" : ""} onClick={() => run(it)}>
                <span>{it.icon}</span>
                {it.label}
              </button>
            ))
          ) : (
            <p className="mute" style={{ padding: "14px 18px" }}>
              Nothing found. Try another word.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
