"use client";
import { Search, SunMoon } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Topbar() {
  const { openPalette, toggleTheme, currentProjectId, openNewTaskModal } = useStore();

  return (
    <div className="bar">
      <button className="sb" onClick={openPalette}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={16} />
          Search or jump to anything
        </span>
        <kbd>Ctrl K</kbd>
      </button>
      <span className="grow"></span>
      <button className="ic" aria-label="Switch theme" onClick={toggleTheme}>
        <SunMoon size={18} />
      </button>
      <button className="btn" onClick={() => openNewTaskModal(currentProjectId)}>
        ＋ New task
      </button>
    </div>
  );
}
