"use client";
import { useRouter } from "next/navigation";
import { useStore, health } from "@/lib/store";
import { ProjectId } from "@/types";
import { Avatar, DueLabel, Ecg, HealthBreakdown } from "@/components/ui";

export default function Dashboard() {
  const { tasks, openDrawer, projects } = useStore();
  const router = useRouter();
  const mine = tasks.filter((t) => t.assignee === "me" && t.status !== "done").sort((a, b) => a.dueOffset - b.dueOffset);

  return (
    <>
      <div className="top">
        <div>
          <h1>Good morning, Ali</h1>
          <p className="mute">Tuesday, 29 September. {mine.filter((t) => t.dueOffset <= 1).length} tasks need you in the next 24 hours.</p>
        </div>
        <span className="stack">
          {(["me", "ak", "ba", "sm"] as const).map((k) => (
            <Avatar key={k} id={k} ring />
          ))}
        </span>
      </div>

      <div className="card catch">
        <div className="meta" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Catch me up</h2>
          <span className="mute">Since yesterday, 6:40 pm</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span className="chip">4 tasks moved</span>
          <span className="chip">3 comments</span>
          <span className="chip">1 new blocker</span>
          <span className="chip">1 overdue</span>
        </div>
        <button className="ln" onClick={() => openDrawer("t1")}>
          <span>💬</span>
          <span>
            <b>Ayesha</b> asked for a bigger headline on Design hero section. Your reply is still pending.
          </span>
        </button>
        <button className="ln" onClick={() => openDrawer("t10")}>
          <span>🔒</span>
          <span>
            <b>Fix login crash on Android</b> is now blocking Biometric prompt QA. Bilal is on it, due tomorrow.
          </span>
        </button>
        <button className="ln" onClick={() => openDrawer("t15")}>
          <span>⏰</span>
          <span>
            <b>Rollout plan</b> slipped 2 days past its due date and is dragging Q4 launch health down.
          </span>
        </button>
      </div>

      <h2>Project pulse</h2>
      <div className="grid g3" style={{ marginBottom: 18 }}>
        {(Object.keys(projects) as ProjectId[]).map((k) => {
          const h = health(k, tasks);
          return (
            <button key={k} className="card pc" onClick={() => router.push(`/projects/${k}`)}>
              <div className="meta">
                <b>{projects[k].name}</b>
                <span className="chip" style={{ color: h.color }}>
                  {h.label}
                </span>
              </div>
              <div className="meta" style={{ margin: "10px 0" }}>
                <span className="score" style={{ color: h.color }}>
                  {h.score}
                </span>
                <span className="mute">
                  {h.overdue} overdue, {h.blocked} blocked
                  <br />
                  {h.done} of {h.total} done
                </span>
              </div>
              <Ecg score={h.score} color={h.color} critical={h.critical} />
              <HealthBreakdown health={h} prefix={`Why ${h.score}?`} />
            </button>
          );
        })}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="meta">
            <h2>Sprint 14 burndown</h2>
            <span className="mute">6 days left</span>
          </div>
          <svg viewBox="0 0 320 140" style={{ width: "100%" }}>
            <line x1="10" y1="10" x2="10" y2="120" stroke="var(--line)" />
            <line x1="10" y1="120" x2="315" y2="120" stroke="var(--line)" />
            <line x1="10" y1="16" x2="310" y2="120" stroke="var(--mute)" strokeDasharray="5 5" />
            <polygon points="10,16 60,30 110,44 160,52 210,78 260,86 260,120 10,120" fill="#12B5A0" opacity={0.14} />
            <polyline points="10,16 60,30 110,44 160,52 210,78 260,86" fill="none" stroke="#12B5A0" strokeWidth={3} strokeLinejoin="round" />
            <circle cx="260" cy="86" r="5" fill="#12B5A0" />
          </svg>
          <p className="mute">You are 1 task ahead of the ideal line.</p>
        </div>
        <div className="card">
          <h2>Up next for you</h2>
          {mine.slice(0, 5).map((t) => (
            <button className="row" key={t.id} onClick={() => openDrawer(t.id)}>
              <span>
                <b>{t.title}</b>
                <br />
                <span className="mute">{projects[t.projectId].name}</span>
              </span>
              <DueLabel task={t} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
