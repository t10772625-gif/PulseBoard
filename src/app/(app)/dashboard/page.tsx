"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, health, isBlocked } from "@/lib/store";
import { nextActions } from "@/lib/ai";
import { TODAY, dateForOffset } from "@/lib/mock-data";
import { ProjectId } from "@/types";
import { Avatar, DueLabel, Ecg, EmptyState, HealthBreakdown, Switch } from "@/components/ui";
import { Legend, LineChart, Series } from "@/components/Charts";

const WIDGETS = [
  ["catch", "Catch me up"],
  ["pulse", "Project pulse"],
  ["burndown", "Burndown"],
  ["next", "Up next"],
  ["actions", "Next best actions"],
  ["reminders", "Smart reminders"],
] as const;
type WidgetId = (typeof WIDGETS)[number][0];

export default function Dashboard() {
  const { tasks, openDrawer, projects, can, members, realMode } = useStore();
  const firstName = members.me?.name.split(" ")[0] ?? "there";
  const router = useRouter();
  const [hidden, setHidden] = useState<WidgetId[]>([]);
  const [customizing, setCustomizing] = useState(false);
  const mine = tasks.filter((t) => t.assignee === "me" && t.status !== "done").sort((a, b) => a.dueOffset - b.dueOffset);

  // Widget visibility is a per-browser preference (VIEW-09)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pb_dash_hidden");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-browser preference that isn't available during SSR
      if (saved) setHidden(JSON.parse(saved));
    } catch {}
  }, []);
  function toggle(id: WidgetId) {
    const next = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id];
    setHidden(next);
    try {
      localStorage.setItem("pb_dash_hidden", JSON.stringify(next));
    } catch {}
  }
  const show = (id: WidgetId) => !hidden.includes(id);

  // Burndown from real task data: open tasks remaining per day over the last 8 days,
  // against an ideal line that reaches zero at the sprint end (6 days from today).
  const days = Array.from({ length: 9 }, (_, i) => 8 - i);
  const remaining = days.map(
    (d) => tasks.filter((t) => t.createdDaysAgo >= d && !(t.status === "done" && (t.completedDaysAgo ?? Math.max(0, t.createdDaysAgo - 2)) >= d)).length
  );
  const sprintEnd = 6;
  const idealStart = remaining[0];
  const labels = [...days.map((d) => dateForOffset(-d)), ...Array.from({ length: sprintEnd }, (_, i) => dateForOffset(i + 1))];
  const ideal = labels.map((_, i) => Math.max(0, Math.round((idealStart * (labels.length - 1 - i)) / (labels.length - 1))));
  const burn: Series[] = [
    { name: "Ideal", color: "var(--mute)", values: ideal, dashed: true },
    { name: "Remaining", color: "#12B5A0", values: remaining, fill: true },
  ];
  const ahead = ideal[days.length - 1] - remaining[remaining.length - 1];

  // Smart reminders (NOTIF-04): due soon, with the context that matters
  const reminders = mine
    .filter((t) => t.dueOffset <= 1)
    .map((t) => {
      const blocker = t.blockedBy ? tasks.find((b) => b.id === t.blockedBy) : undefined;
      const left = t.subtasks.filter((s) => !s[1]).length;
      const context = isBlocked(t, tasks)
        ? `Blocked by "${blocker!.title}" — ping ${blocker!.assignee === "me" ? "yourself" : "its owner"}.`
        : left
          ? `${left} subtask(s) left.`
          : t.status === "rev"
            ? "Waiting on review — nudge the reviewer."
            : "Ready to finish.";
      return { t, context };
    });

  return (
    <>
      <div className="top">
        <div>
          <h1>Hello, {firstName}</h1>
          <p className="mute">{TODAY.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}. {mine.filter((t) => t.dueOffset <= 1).length} tasks need you in the next 24 hours.</p>
        </div>
        <div className="pill-row">
          <span className="stack">
            {Object.keys(members).map((k) => (
              <Avatar key={k} id={k} ring />
            ))}
          </span>
          {can("VIEW-09") && (
            <button className={`ghost sm ${customizing ? "on" : ""}`} onClick={() => setCustomizing((c) => !c)}>
              Customize
            </button>
          )}
        </div>
      </div>

      {customizing && (
        <div className="card pill-row" style={{ marginBottom: 16 }}>
          {WIDGETS.map(([id, label]) => (
            <span key={id} className="switch-chip">
              <Switch label={`Show ${label}`} checked={show(id)} onChange={() => toggle(id)} />
              {label}
            </span>
          ))}
        </div>
      )}

      {show("catch") && !realMode && (
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
      )}

      {show("pulse") && (
        <>
          <h2>Project pulse</h2>
          <div className="grid g3" style={{ marginBottom: 18 }}>
            {Object.keys(projects).length === 0 && <EmptyState title="No projects yet" message="Projects you create or join show their health here." />}
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
        </>
      )}

      <div className="grid g2">
        {show("burndown") && (
          <div className="card">
            <div className="meta">
              <h2>Sprint burndown</h2>
              <span className="mute">{sprintEnd} days left</span>
            </div>
            <LineChart series={burn} labels={labels} height={150} />
            <Legend series={burn} />
            <p className="mute" style={{ marginTop: 6 }}>
              {ahead >= 0 ? `You are ${ahead} task${ahead === 1 ? "" : "s"} ahead of the ideal line.` : `You are ${-ahead} task${ahead === -1 ? "" : "s"} behind the ideal line.`}
            </p>
          </div>
        )}
        {show("next") && (
          <div className="card">
            <h2>Up next for you</h2>
            {mine.length === 0 && <EmptyState title="Nothing assigned to you" message="Tasks assigned to you will appear here." />}
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
        )}
        {show("actions") && can("AI-19") && (
          <div className="card">
            <h2>Next best actions</h2>
            {nextActions(tasks).map((a) => (
              <button key={a.taskId} className="row" onClick={() => openDrawer(a.taskId)}>
                <span>{a.text}</span>
                <span className="mute" style={{ fontSize: 12 }}>
                  {a.why}
                </span>
              </button>
            ))}
          </div>
        )}
        {show("reminders") && can("NOTIF-04") && (
          <div className="card">
            <h2>Smart reminders</h2>
            {reminders.length ? (
              reminders.map(({ t, context }) => (
                <button key={t.id} className="row" onClick={() => openDrawer(t.id)}>
                  <span>
                    <b>{t.title}</b> <DueLabel task={t} />
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      {context}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="mute">Nothing due in the next day.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
