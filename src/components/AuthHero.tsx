"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Activity, BarChart3, Languages, LayoutGrid, ShieldCheck, Sparkles, Timer, Zap, type LucideIcon } from "lucide-react";
import { HeroEcg } from "./ui";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// Floating feature cards on the sign-in / sign-up pages. Only features that exist in
// the app today are listed, and rule-based helpers say so (CLAUDE.md §25).
const FEATURES: { icon: LucideIcon; title: MessageKey; text: MessageKey; tone: string }[] = [
  { icon: Activity, title: "hero.f.health", text: "hero.f.healthText", tone: "#12B5A0" },
  { icon: LayoutGrid, title: "hero.f.views", text: "hero.f.viewsText", tone: "#3A86FF" },
  { icon: ShieldCheck, title: "hero.f.roles", text: "hero.f.rolesText", tone: "#9B6CFF" },
  { icon: Sparkles, title: "hero.f.assign", text: "hero.f.assignText", tone: "#F0A400" },
  { icon: Zap, title: "hero.f.rules", text: "hero.f.rulesText", tone: "#FF6B57" },
  { icon: BarChart3, title: "hero.f.analytics", text: "hero.f.analyticsText", tone: "#12B5A0" },
  { icon: Timer, title: "hero.f.time", text: "hero.f.timeText", tone: "#3A86FF" },
  { icon: Languages, title: "hero.f.lang", text: "hero.f.langText", tone: "#9B6CFF" },
];

// Where a card is right now: x / y as % of the card area (kept inside it), and its
// depth — 0 = far back (small, dim), 2 = front (full size, sharp, on top)
type Spot = { x: number; y: number; depth: 0 | 1 | 2 };
const DEPTH_SCALE = [0.84, 0.94, 1.04];
const DEPTH_OPACITY = [0.55, 0.8, 1];
const MOVE_MS = 6000;

// Starting layout (same on the server and the first browser render): a loose
// spread, so the first paint already looks scattered rather than gridded
const START: Spot[] = [
  { x: 2, y: 0, depth: 2 },
  { x: 54, y: 6, depth: 1 },
  { x: 14, y: 34, depth: 1 },
  { x: 62, y: 38, depth: 2 },
  { x: 4, y: 66, depth: 2 },
  { x: 50, y: 70, depth: 0 },
  { x: 16, y: 100, depth: 1 },
  { x: 60, y: 100, depth: 2 },
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function AuthHero({ heading, description }: { heading: string; description: string }) {
  const { t } = useT();
  const [spots, setSpots] = useState<Spot[]>(START);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const areaRef = useRef<HTMLUListElement>(null);

  const cellsRef = useRef<number[] | null>(null);

  // The card area is split into cells (2 columns, 3 when it's wide). Every few
  // seconds two random pairs of cards swap cells — while they pass each other one goes
  // to the front and the other to the back — and every card gets a small random nudge.
  // Only a few cards travel at a time, so they stay spread out and readable.
  // CSS transitions do the movement. Off when the user prefers less motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const n = FEATURES.length;
    const move = () => {
      const wide = (areaRef.current?.clientWidth ?? 0) > 820;
      const cols = wide ? 3 : 2;
      const rows = Math.ceil(n / cols);
      const cellW = 100 / cols;
      const cardW = 32; // % of the area, see .hero-card width
      // First run: a random arrangement; later runs: swap two pairs
      let cells = cellsRef.current;
      const swapped = new Set<number>();
      if (!cells || cells.length !== n || Math.max(...cells) >= cols * rows) {
        cells = Array.from({ length: cols * rows }, (_, k) => k).sort(() => Math.random() - 0.5).slice(0, n);
      } else {
        cells = [...cells];
        for (let k = 0; k < 2; k++) {
          const a = Math.floor(Math.random() * n);
          let b = Math.floor(Math.random() * n);
          if (b === a) b = (a + 1) % n;
          [cells[a], cells[b]] = [cells[b], cells[a]];
          swapped.add(a).add(b);
        }
      }
      cellsRef.current = cells;
      const placed = cells;
      setSpots((cur) =>
        FEATURES.map((_, i) => {
          const c = placed[i] % cols;
          const r = Math.floor(placed[i] / cols);
          const room = Math.max(0, cellW - cardW);
          // Travelling cards: alternate front / back so crossing reads as depth
          const depth = (swapped.has(i) ? ([...swapped].indexOf(i) % 2 ? 0 : 2) : cur[i]?.depth ?? 1) as Spot["depth"];
          return {
            x: Math.min(100 - cardW, c * cellW + rand(0, room)),
            // top: y% with translateY(-y%) keeps the card inside the area for y in 0–100
            y: Math.min(100, Math.max(0, (rows === 1 ? 50 : (r / (rows - 1)) * 100) + rand(-6, 6))),
            depth,
          };
        })
      );
    };
    const first = setTimeout(move, 400);
    timer.current = setInterval(move, MOVE_MS);
    return () => {
      clearTimeout(first);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <div className="hero">
      <div className="logo">
        <b></b>PulseBoard
      </div>
      <ul ref={areaRef} className="hero-cards" aria-label={t("hero.featuresLabel")}>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const s = spots[i];
          const style = {
            "--tone": f.tone,
            left: `${s.x}%`,
            top: `${s.y}%`,
            zIndex: s.depth + 1,
            opacity: DEPTH_OPACITY[s.depth],
            transform: `translateY(-${s.y}%) scale(${DEPTH_SCALE[s.depth]})`,
            filter: s.depth === 0 ? "blur(1px)" : "none",
          } as CSSProperties;
          return (
            <li key={f.title} className="hero-card" style={style}>
              <span className="hero-ic" aria-hidden>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span>
                {t(f.title)}
                <small>{t(f.text)}</small>
              </span>
            </li>
          );
        })}
      </ul>
      <HeroEcg />
      <div>
        <h2>{heading}</h2>
        <p style={{ color: "#B9CCDA", maxWidth: 400 }}>{description}</p>
      </div>
    </div>
  );
}
