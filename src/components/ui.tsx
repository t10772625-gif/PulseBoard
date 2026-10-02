import { CSSProperties, ReactNode } from "react";
import { Health, MemberId, Priority, Task } from "@/types";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";

export function Avatar({ id, ring, large }: { id: MemberId; ring?: boolean; large?: boolean }) {
  const { members } = useStore();
  const { t } = useT();
  // A removed member (or a stale id) still renders instead of crashing
  const m = members[id] ?? { name: t("ui.formerMember"), initials: "?", colorClass: "c4" as const };
  return (
    <span className={`av ${m.colorClass} ${ring ? "ring" : ""} ${large ? "lg" : ""}`} title={m.name}>
      {m.initials}
    </span>
  );
}

// On/off control styled to match the app (use instead of a bare checkbox for settings)
export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? "on" : ""}`} disabled={disabled} onClick={() => onChange(!checked)}>
      <i />
    </button>
  );
}

// A settings row: title + optional hint on the left, control on the right
export function SettingRow({ title, hint, children }: { title: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div>
        <b>{title}</b>
        {hint && <p className="mute">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// Shown when a list has nothing to show yet (new workspace, filters, missing item)
// Designed "nothing here yet" card, in the same language as the workspace loader:
// a soft pulsing badge with an icon, a title, a hint and an optional action.
export function EmptyState({ title, message, action, icon, compact }: { title: string; message?: string; action?: ReactNode; icon?: ReactNode; compact?: boolean }) {
  return (
    <div className={`empty-state${compact ? " compact" : ""}`} role="status">
      <span className="es-badge" aria-hidden="true">
        <span className="es-ring" />
        <span className="es-ring r2" />
        <span className="es-icon">
          {icon ?? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          )}
        </span>
      </span>
      <b>{title}</b>
      {message && <p className="mute">{message}</p>}
      {action && <div className="es-action">{action}</div>}
    </div>
  );
}

export function PriorityTag({ p }: { p: Priority }) {
  const cls = p === "h" ? "hi" : p === "m" ? "md" : "lo";
  return <span className={`tag ${cls}`}>{PRIORITY_LABEL[p]}</span>;
}

export function DueLabel({ task }: { task: Task }) {
  const { t } = useT();
  if (task.status === "done") return <span className="due ok">{t("common.done")}</span>;
  if (task.dueOffset < 0) return <span className="due bad">{t("ui.daysOverdue", { n: -task.dueOffset })}</span>;
  const text = task.dueOffset === 0 ? t("common.today") : task.dueOffset === 1 ? t("common.tomorrow") : dateForOffset(task.dueOffset);
  return <span className="due">{text}</span>;
}

function ecgPath(score: number): string {
  const a = (score / 100) * 20 + 4;
  let d = "M0 30";
  for (let i = 0; i < 4; i++) {
    const x = i * 60;
    const A = a * (i % 2 && score < 75 ? 0.45 : 1);
    d += ` L${x + 18} 30 L${x + 22} ${30 - A * 0.3} L${x + 26} 30 L${x + 30} ${30 + A * 0.35} L${x + 34} ${
      30 - A
    } L${x + 38} ${30 + A * 0.5} L${x + 42} 30 L${x + 60} 30`;
  }
  return d;
}

export function Ecg({ score, color, height = 48, critical }: { score: number; color: string; height?: number; critical?: boolean }) {
  const d = ecgPath(score);
  const style = { "--c": color, height } as CSSProperties;
  return (
    <svg className={`ecg ${critical ? "crit" : ""}`} viewBox="0 0 240 48" style={style} preserveAspectRatio="none">
      <path className="bg" d={d} />
      <path className="fg" pathLength={1} d={d} />
    </svg>
  );
}

export function HealthBreakdown({ health, prefix }: { health: Health; prefix?: string }) {
  const { t } = useT();
  if (health.breakdown.length === 0) {
    return (
      <p className="mute" style={{ fontSize: 12 }}>
        {prefix ? `${prefix} ` : ""}
        {t("ui.noIssues")}
      </p>
    );
  }
  return (
    <p className="mute" style={{ fontSize: 12 }}>
      {prefix && <>{prefix} </>}
      {health.breakdown.map((f, i) => (
        <span key={f.label}>
          {i > 0 && " · "}
          {f.label} ({f.points})
        </span>
      ))}
    </p>
  );
}

export const STATIC_HERO_ECG_PATH =
  "M0 30L18 30L22 25L26 30L30 37L34 12L38 34L42 30L60 30L78 30L82 25L86 30L90 37L94 12L98 34L102 30L120 30L138 30L142 25L146 30L150 37L154 12L158 34L162 30L180 30L198 30L202 25L206 30L210 37L214 12L218 34L222 30L240 30";

export function HeroEcg() {
  const style = { "--c": "#12B5A0", height: 90 } as CSSProperties;
  return (
    <svg className="ecg" viewBox="0 0 240 48" style={style} preserveAspectRatio="none">
      <path className="bg" d={STATIC_HERO_ECG_PATH} />
      <path className="fg" pathLength={1} d={STATIC_HERO_ECG_PATH} />
    </svg>
  );
}
