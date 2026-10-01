"use client";
import { useRef, useState } from "react";
import { BellOff, Bell, Mic, Search, SunMoon } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseTaskText } from "@/lib/ai";
import { dateForOffset } from "@/lib/mock-data";
import UserMenu from "./UserMenu";
import { useT } from "@/i18n/I18nProvider";
import { localeInfo } from "@/i18n";

type Recognition = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };

export default function Topbar() {
  const { openPalette, toggleTheme, dndUntil, setDnd, can, createTask, currentProjectId, projects, members, toast, openDrawer, allowed } = useStore();
  const { t, locale, fmt } = useT();
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  // Expiry is checked when the notification is sent (store.notify); here "set" means on
  const muted = dndUntil !== null;

  // Voice → task (AI-07). Uses the browser's built-in speech recognition, so it
  // works in Chrome/Edge/Safari; other browsers get a message instead.
  function voice() {
    if (!can("AI-07")) return toast(t("voice.legendaryOnly"));
    if (!allowed("task.create")) return toast(t("voice.noCreate"));
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return toast(t("voice.unsupported"));
    if (listening) return recRef.current?.stop();
    const rec = new Ctor();
    rec.lang = localeInfo(locale).intl;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const p = parseTaskText(text, members);
      if (!p.title) return toast(t("voice.noTitle"));
      if (!projects[currentProjectId]) return toast(t("voice.noBoard"));
      const id = createTask({ projectId: currentProjectId, title: p.title, priority: p.priority, assignee: p.assignee ?? "me", dueOffset: p.dueOffset, labels: p.labels });
      toast(t("voice.created", { title: p.title, project: projects[currentProjectId].name, due: dateForOffset(p.dueOffset) }));
      openDrawer(id);
    };
    rec.onerror = () => toast(t("voice.micError"));
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
          {t("topbar.search")}
        </span>
        <kbd>Ctrl K</kbd>
      </button>
      <span className="grow"></span>
      <button className={`ic ${listening ? "rec" : ""}`} aria-label={listening ? t("topbar.voiceStop") : t("topbar.voiceStart")} title={t("topbar.voiceHint")} onClick={voice}>
        <Mic size={18} />
      </button>
      <button
        className="ic"
        aria-label={muted ? t("topbar.dndOff") : t("topbar.dndOn")}
        title={muted ? t("topbar.mutedUntil", { time: fmt.time(dndUntil!) }) : t("topbar.dndTitle")}
        onClick={() => {
          setDnd(muted ? null : 60);
          toast(muted ? t("topbar.notificationsOn") : t("topbar.dndToast"));
        }}
      >
        {muted ? <BellOff size={18} /> : <Bell size={18} />}
      </button>
      <button className="ic" aria-label={t("topbar.switchTheme")} onClick={toggleTheme}>
        <SunMoon size={18} />
      </button>
      <UserMenu />
    </div>
  );
}
