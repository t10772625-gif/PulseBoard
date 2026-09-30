"use client";
import { useRef, useState } from "react";
import { BellOff, Bell, Mic, Search, SunMoon } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseTaskText } from "@/lib/ai";
import { dateForOffset } from "@/lib/mock-data";
import UserMenu from "./UserMenu";

type Recognition = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };

export default function Topbar() {
  const { openPalette, toggleTheme, dndUntil, setDnd, can, createTask, currentProjectId, projects, members, toast, openDrawer, allowed } = useStore();
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  // Expiry is checked when the notification is sent (store.notify); here "set" means on
  const muted = dndUntil !== null;

  // Voice → task (AI-07). Uses the browser's built-in speech recognition, so it
  // works in Chrome/Edge/Safari; other browsers get a message instead.
  function voice() {
    if (!can("AI-07")) return toast("Voice commands are on the Legendary plan");
    if (!allowed("task.create")) return toast("Your role can't create tasks");
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return toast("This browser doesn't support voice input — try Chrome or Edge");
    if (listening) return recRef.current?.stop();
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const p = parseTaskText(text, members);
      if (!p.title) return toast("Didn't catch a task title");
      if (!projects[currentProjectId]) return toast("Create a board first");
      const id = createTask({ projectId: currentProjectId, title: p.title, priority: p.priority, assignee: p.assignee ?? "me", dueOffset: p.dueOffset, labels: p.labels });
      toast(`🎙 Created "${p.title}" in ${projects[currentProjectId].name}, due ${dateForOffset(p.dueOffset)}`);
      openDrawer(id);
    };
    rec.onerror = () => toast("Couldn't hear that — check microphone permission");
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

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
      <button className={`ic ${listening ? "rec" : ""}`} aria-label={listening ? "Stop listening" : "Create a task by voice"} title='Voice: "Fix login bug tomorrow high for Bilal"' onClick={voice}>
        <Mic size={18} />
      </button>
      <button
        className="ic"
        aria-label={muted ? "Turn off Do Not Disturb" : "Do Not Disturb for 1 hour"}
        title={muted ? `Muted until ${new Date(dndUntil!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Do Not Disturb (1 hour)"}
        onClick={() => {
          setDnd(muted ? null : 60);
          toast(muted ? "Notifications on" : "🔕 Do Not Disturb for 1 hour");
        }}
      >
        {muted ? <BellOff size={18} /> : <Bell size={18} />}
      </button>
      <button className="ic" aria-label="Switch theme" onClick={toggleTheme}>
        <SunMoon size={18} />
      </button>
      <UserMenu />
    </div>
  );
}
