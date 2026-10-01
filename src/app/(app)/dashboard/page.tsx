"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, health, isBlocked } from "@/lib/store";
import { nextActions } from "@/lib/ai";
import { TODAY, dateForOffset } from "@/lib/mock-data";
import { ProjectId } from "@/types";
import { Avatar, DueLabel, Ecg, EmptyState, HealthBreakdown, Switch } from "@/components/ui";
import { Legend, LineChart, Series } from "@/components/Charts";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const WIDGETS = [
  ["catch", "dash.wCatch"],
  ["pulse", "dash.wPulse"],
  ["burndown", "dash.wBurndown"],
  ["next", "dash.wNext"],
  ["actions", "dash.wActions"],
  ["reminders", "dash.wReminders"],
] as const satisfies readonly (readonly [string, MessageKey])[];
type WidgetId = (typeof WIDGETS)[number][0];

export default function Dashboard() {
  const { tasks, openDrawer, projects, can, members, realMode } = useStore();
  const { t: tt, rich, fmt } = useT();
  const firstName = members.me?.name.split(" ")[0] ?? tt("dash.there");
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
    { name: tt("dash.ideal"), color: "var(--mute)", values: ideal, dashed: true },
    { name: tt("dash.remaining"), color: "#12B5A0", values: remaining, fill: true },
  ];
  const ahead = ideal[days.length - 1] - remaining[remaining.length - 1];

  // Smart reminders (NOTIF-04): due soon, with the context that matters
  const reminders = mine
    .filter((t) => t.dueOffset <= 1)
    .map((t) => {
      const blocker = t.blockedBy ? tasks.find((b) => b.id === t.blockedBy) : undefined;
      const left = t.subtasks.filter((s) => !s[1]).length;
      const context = isBlocked(t, tasks)
        ? tt("dash.remBlocked", { title: blocker!.title, who: blocker!.assignee === "me" ? tt("dash.yourself") : tt("dash.itsOwner") })
        : left
          ? tt("dash.remSubtasks", { n: left })
          : t.status === "rev"
            ? tt("dash.remReview")
            : tt("dash.remReady");
      return { t, context };
    });

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("dash.hello", { name: firstName })}</h1>
          <p className="mute">{tt("dash.needYou", { date: fmt.date(TODAY, { weekday: "long", day: "numeric", month: "long" }), n: mine.filter((t) => t.dueOffset <= 1).length })}</p>
        </div>
        <div className="pill-row">
          <span className="stack">
            {Object.keys(members).map((k) => (
              <Avatar key={k} id={k} ring />
            ))}
          </span>
          {can("VIEW-09") && (
            <button className={`ghost sm ${customizing ? "on" : ""}`} onClick={() => setCustomizing((c) => !c)}>
              {tt("dash.customize")}
            </button>
          )}
        </div>
      </div>

      {customizing && (
        <div className="card pill-row" style={{ marginBottom: 16 }}>
          {WIDGETS.map(([id, key]) => (
            <span key={id} className="switch-chip">
              <Switch label={tt("dash.show", { widget: tt(key) })} checked={show(id)} onChange={() => toggle(id)} />
              {tt(key)}
            </span>
          ))}
        </div>
      )}

      {show("catch") && !realMode && (
        <div className="card catch">
          <div className="meta" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>{tt("dash.wCatch")}</h2>
            <span className="mute">{tt("dash.since")}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span className="chip">{tt("dash.chipMoved")}</span>
            <span className="chip">{tt("dash.chipComments")}</span>
            <span className="chip">{tt("dash.chipBlocker")}</span>
            <span className="chip">{tt("dash.chipOverdue")}</span>
          </div>
          <button className="ln" onClick={() => openDrawer("t1")}>
            <span>💬</span>
            <span>{rich("dash.catch1")}</span>
          </button>
          <button className="ln" onClick={() => openDrawer("t10")}>
            <span>🔒</span>
            <span>{rich("dash.catch2")}</span>
          </button>
          <button className="ln" onClick={() => openDrawer("t15")}>
            <span>⏰</span>
            <span>{rich("dash.catch3")}</span>
          </button>
        </div>
      )}

      {show("pulse") && (
        <>
          <h2>{tt("dash.wPulse")}</h2>
          <div className="grid g3" style={{ marginBottom: 18 }}>
            {Object.keys(projects).length === 0 && <EmptyState title={tt("dash.noProjects")} message={tt("dash.noProjectsMsg")} />}
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
                      {tt("dash.pulseLine1", { overdue: h.overdue, blocked: h.blocked })}
                      <br />
                      {tt("dash.pulseLine2", { done: h.done, total: h.total })}
                    </span>
                  </div>
                  <Ecg score={h.score} color={h.color} critical={h.critical} />
                  <HealthBreakdown health={h} prefix={tt("dash.why", { score: h.score })} />
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
              <h2>{tt("dash.sprintBurndown")}</h2>
              <span className="mute">{tt("dash.daysLeft", { n: sprintEnd })}</span>
            </div>
            <LineChart series={burn} labels={labels} height={150} />
            <Legend series={burn} />
            <p className="mute" style={{ marginTop: 6 }}>
              {ahead >= 0 ? tt("dash.ahead", { n: ahead }) : tt("dash.behind", { n: -ahead })}
            </p>
          </div>
        )}
        {show("next") && (
          <div className="card">
            <h2>{tt("dash.upNext")}</h2>
            {mine.length === 0 && <EmptyState title={tt("dash.nothingAssigned")} message={tt("dash.nothingAssignedMsg")} />}
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
            <h2>{tt("dash.wActions")}</h2>
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
            <h2>{tt("dash.wReminders")}</h2>
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
              <p className="mute">{tt("dash.nothingDue")}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
