"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { boardInsights, estimateAccuracy, processImprovements, retrospective, skillGaps, standupSummary, taskModule, wellbeing } from "@/lib/ai";
import { Priority, ProjectId } from "@/types";
import { Avatar } from "@/components/ui";
import { Bars, Legend, LineChart, Series } from "@/components/Charts";
import Gate from "@/components/Gate";
import { download } from "@/lib/csv";

type Item = { title: string; module: string; assignee: string; priority: Priority; created: number; started?: number; completed?: number; est: number; actual: number };

const TABS = ["Delivery", "Time", "Team", "Reports"] as const;
const SLA_DEFAULT: Record<Priority, number> = { h: 3, m: 7, l: 14 };

export default function Analytics() {
  const { tasks, history, members, capacity, survey, projects, getColumns, openDrawer, toast, can } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Delivery");
  const [sla, setSla] = useState(SLA_DEFAULT);

  // One timeline of work items: past sprints (history) + the live board
  const items: Item[] = [
    ...history.map((h) => ({ title: h.title, module: h.module, assignee: h.assignee, priority: h.priority, created: h.createdDaysAgo, started: h.startedDaysAgo, completed: h.completedDaysAgo, est: h.estimateHours, actual: h.actualHours })),
    ...tasks.map((t) => ({
      title: t.title,
      module: taskModule(t),
      assignee: t.assignee,
      priority: t.priority,
      created: t.createdDaysAgo,
      started: t.startedDaysAgo ?? (t.status !== "todo" ? Math.max(0, t.createdDaysAgo - 1) : undefined),
      completed: t.status === "done" ? t.completedDaysAgo ?? Math.max(0, t.createdDaysAgo - 2) : undefined,
      est: t.estimateHours ?? t.lengthDays,
      actual: t.trackedSeconds / 3600,
    })),
  ];
  const done = items.filter((i) => i.completed !== undefined);
  const days = Array.from({ length: 15 }, (_, i) => 14 - i); // 14 days ago → today
  const dayLabels = days.map((d) => dateForOffset(-d));
  const weeks = [3, 2, 1, 0];
  const weekLabels = weeks.map((w) => (w === 0 ? "This wk" : `${w}w ago`));
  const inWeek = (daysAgo: number, w: number) => daysAgo >= w * 7 && daysAgo < (w + 1) * 7;

  const throughput = weeks.map((w) => done.filter((i) => inWeek(i.completed!, w)).length);
  const velocity = weeks.map((w) => Math.round(done.filter((i) => inWeek(i.completed!, w)).reduce((s, i) => s + i.actual, 0)));
  const cycle = done.filter((i) => i.started !== undefined).map((i) => i.started! - i.completed!);
  const lead = done.map((i) => i.created - i.completed!);
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "–");

  const scope = days.map((d) => items.filter((i) => i.created >= d).length);
  const completedCum = days.map((d) => done.filter((i) => i.completed! >= d).length);
  const cfdTodo = days.map((d) => items.filter((i) => i.created >= d && (i.started === undefined || i.started < d)).length);
  const cfdProg = days.map((d) => items.filter((i) => i.started !== undefined && i.started >= d && (i.completed === undefined || i.completed < d)).length);
  const cfdDone = completedCum;

  const open = tasks.filter((t) => t.status !== "done");
  const aging = [...open].sort((a, b) => b.createdDaysAgo - a.createdDaysAgo);
  const slaBreachesPast = done.filter((i) => i.started !== undefined && i.started - i.completed! > sla[i.priority]);
  const slaAtRisk = open.filter((t) => t.createdDaysAgo > sla[t.priority]);
  const slaMet = done.length ? Math.round(((done.length - slaBreachesPast.length) / done.length) * 100) : 100;

  const modules = Array.from(new Set(history.map((h) => h.module)));
  const byModule = modules.map((m) => {
    const xs = history.filter((h) => h.module === m);
    return { module: m, est: xs.reduce((s, h) => s + h.estimateHours, 0), actual: xs.reduce((s, h) => s + h.actualHours, 0), n: xs.length };
  });

  const bugWeeks = weeks.map((w) => items.filter((i) => inWeek(i.created, w) && i.priority === "h").length);
  const trend = bugWeeks.length > 1 ? (bugWeeks[bugWeeks.length - 1] - bugWeeks[0]) / (bugWeeks.length - 1) : 0;
  const forecast = Math.max(0, Math.round(bugWeeks[bugWeeks.length - 1] + trend));

  const retro = retrospective(tasks, history);
  const weekly = weeklyReport();

  function weeklyReport() {
    const doneWeek = done.filter((i) => i.completed! < 7);
    return [
      `Weekly report — ${dateForOffset(-6)} to ${dateForOffset(0)}`,
      "",
      "Highlights:",
      `- ${doneWeek.length} tasks completed (${doneWeek.filter((i) => i.priority === "h").length} high priority)`,
      `- Average cycle time ${avg(cycle)} days`,
      `- SLA met on ${slaMet}% of work`,
      "",
      "Lowlights:",
      `- ${open.filter((t) => t.dueOffset < 0).length} overdue task(s)`,
      `- ${slaAtRisk.length} open task(s) past their SLA`,
      "",
      "Next week:",
      `- ${open.filter((t) => t.dueOffset >= 0 && t.dueOffset <= 7).length} tasks due`,
      ...Object.keys(projects).map((p) => `- ${projects[p as ProjectId].name}: ${tasks.filter((t) => t.projectId === p && t.status !== "done").length} open`),
    ].join("\n");
  }

  const burnSeries: Series[] = [
    { name: "Scope", color: "var(--mute)", values: scope, dashed: true },
    { name: "Completed", color: "#12B5A0", values: completedCum, fill: true },
  ];
  const cfdSeries: Series[] = [
    { name: "Done", color: "#12B5A0", values: cfdDone },
    { name: "In progress", color: "#3A86FF", values: cfdProg },
    { name: "To do", color: "#F0A400", values: cfdTodo },
  ];

  return (
    <>
      <div className="top">
        <div>
          <h1>Analytics</h1>
          <p className="mute">Delivery, time, team health and reports — last 2–4 weeks across all projects.</p>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "Delivery" && (
        <Gate id="ANL-01">
          <div className="grid g3" style={{ marginBottom: 18 }}>
            <div className="card">
              <p className="mute">Throughput this week</p>
              <div className="stat">{throughput[3]}</div>
              <p className="mute" style={{ fontSize: 12 }}>tasks completed</p>
            </div>
            <div className="card">
              <p className="mute">Cycle time / lead time</p>
              <div className="stat">
                {avg(cycle)}d / {avg(lead)}d
              </div>
              <p className="mute" style={{ fontSize: 12 }}>started → done / created → done</p>
            </div>
            <div className="card">
              <p className="mute">SLA met</p>
              <div className="stat" style={{ color: slaMet < 80 ? "var(--bad)" : undefined }}>{slaMet}%</div>
              <p className="mute" style={{ fontSize: 12 }}>{slaAtRisk.length} open task(s) past SLA</p>
            </div>
          </div>
          <div className="grid g2" style={{ marginBottom: 18 }}>
            <div className="card">
              <h2>Burnup (14 days)</h2>
              <LineChart series={burnSeries} labels={dayLabels} />
              <Legend series={burnSeries} />
            </div>
            <div className="card">
              <h2>Cumulative flow</h2>
              <LineChart series={cfdSeries} labels={dayLabels} stacked />
              <Legend series={cfdSeries} />
              <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>A widening blue band means work is piling up in progress.</p>
            </div>
            <div className="card">
              <h2>Throughput per week</h2>
              <Bars values={throughput} labels={weekLabels} />
            </div>
            <div className="card">
              <h2>Velocity (hours per week)</h2>
              <Bars values={velocity} labels={weekLabels} color="#3A86FF" suffix="h" />
            </div>
          </div>
          <div className="grid g2">
            <div className="card">
              <h2>Aging report</h2>
              <table className="tbl">
                <tbody>
                  <tr>
                    <th>Task</th>
                    <th>Age</th>
                    <th>Priority</th>
                    <th>SLA</th>
                  </tr>
                  {aging.slice(0, 8).map((t) => (
                    <tr key={t.id} onClick={() => openDrawer(t.id)}>
                      <td>{t.title}</td>
                      <td>{t.createdDaysAgo}d</td>
                      <td>{PRIORITY_LABEL[t.priority]}</td>
                      <td style={{ color: t.createdDaysAgo > sla[t.priority] ? "var(--bad)" : "var(--acc2)", fontWeight: 700 }}>
                        {t.createdDaysAgo > sla[t.priority] ? `breached (${sla[t.priority]}d)` : "ok"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h2>SLA targets & WIP limits</h2>
              <Gate id="ANL-07">
                <div className="pill-row" style={{ marginBottom: 12 }}>
                  {(["h", "m", "l"] as Priority[]).map((p) => (
                    <label key={p} className="inline">
                      {PRIORITY_LABEL[p]}
                      <input type="number" min={1} style={{ width: 64 }} value={sla[p]} onChange={(e) => setSla({ ...sla, [p]: Math.max(1, Number(e.target.value)) })} />
                      days
                    </label>
                  ))}
                </div>
              </Gate>
              {Object.keys(projects).map((p) =>
                getColumns(p)
                  .filter(([, , limit]) => limit > 0)
                  .map(([s, label, limit]) => {
                    const n = tasks.filter((t) => t.projectId === p && t.status === s).length;
                    return (
                      <div key={p + s} className="wl-row">
                        <span style={{ width: 160, fontSize: 13 }}>
                          {projects[p].name}: {label}
                        </span>
                        <div className="wl-bar">
                          <i style={{ width: `${Math.min(100, (n / limit) * 100)}%`, background: n > limit ? "var(--bad)" : "var(--acc)" }} />
                        </div>
                        <b style={{ color: n > limit ? "var(--bad)" : undefined }}>
                          {n}/{limit}
                        </b>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </Gate>
      )}

      {tab === "Time" && (
        <Gate id="TIME-02">
          <div className="grid g3" style={{ marginBottom: 18 }}>
            <div className="card">
              <p className="mute">Estimate accuracy</p>
              <div className="stat">{estimateAccuracy(history)}%</div>
            </div>
            <div className="card">
              <p className="mute">Hours tracked (live board)</p>
              <div className="stat">{Math.round(tasks.reduce((s, t) => s + t.trackedSeconds, 0) / 3600)}h</div>
            </div>
            <div className="card">
              <p className="mute">Billable hours</p>
              <div className="stat">{Math.round(tasks.filter((t) => t.billable).reduce((s, t) => s + t.trackedSeconds, 0) / 3600)}h</div>
            </div>
          </div>
          <div className="grid g2">
            <div className="card">
              <h2>Estimate vs actual by module</h2>
              <table className="tbl">
                <tbody>
                  <tr>
                    <th>Module</th>
                    <th>Tasks</th>
                    <th>Estimated</th>
                    <th>Actual</th>
                    <th>Over / under</th>
                  </tr>
                  {byModule.map((m) => {
                    const diff = Math.round(((m.actual - m.est) / m.est) * 100);
                    return (
                      <tr key={m.module}>
                        <td>{m.module}</td>
                        <td>{m.n}</td>
                        <td>{m.est}h</td>
                        <td>{m.actual}h</td>
                        <td style={{ color: diff > 15 ? "var(--bad)" : "var(--acc2)", fontWeight: 700 }}>{diff > 0 ? `+${diff}%` : `${diff}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h2>Hours by person (last 4 weeks)</h2>
              <Bars
                values={Object.keys(members).map((m) => Math.round(done.filter((i) => i.assignee === m && i.completed! < 28).reduce((s, i) => s + i.actual, 0)))}
                labels={Object.values(members).map((m) => m.name.split(" ")[0])}
                suffix="h"
              />
            </div>
          </div>
        </Gate>
      )}

      {tab === "Team" && (
        <div className="grid g2">
          <div className="card">
            <h2>Team wellbeing</h2>
            <Gate id="ANL-08">
              <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
                From workload vs capacity, overdue work and the opt-in weekly pulse. No comment or keystroke monitoring.
              </p>
              {wellbeing(tasks, members, capacity, survey).map((w) => (
                <div key={w.member} className="sugg">
                  <span>
                    <Avatar id={w.member} /> <b>{members[w.member].name}</b> — {w.score}/100
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      Workload {w.workload} · Delivery {w.delivery} · Pulse {w.sat}
                    </span>
                  </span>
                  <span className="chip" style={{ color: w.risk === "High" ? "var(--bad)" : w.risk === "Medium" ? "var(--warn)" : "var(--acc2)" }}>
                    {w.risk} risk · {w.suggestion}
                  </span>
                </div>
              ))}
            </Gate>
          </div>
          <div className="card">
            <h2>Skill gaps</h2>
            <Gate id="ANL-11">
              <table className="tbl">
                <tbody>
                  <tr>
                    <th>Module</th>
                    <th>People who&apos;ve done it</th>
                    <th>Bus factor</th>
                    <th>Actual vs est.</th>
                  </tr>
                  {skillGaps(history, members).map((g) => (
                    <tr key={g.module}>
                      <td>{g.module}</td>
                      <td>{g.experts.join(", ")}</td>
                      <td style={{ color: g.busFactor <= 1 ? "var(--bad)" : undefined, fontWeight: 700 }}>{g.busFactor}</td>
                      <td>{g.overrun}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>Bus factor 1 = only one person knows this module. Pair someone with them.</p>
            </Gate>
          </div>
          <div className="card">
            <h2>Standup summary</h2>
            <Gate id="AI-10">
              {standupSummary(tasks, members).map((s) => (
                <div key={s.member} style={{ marginBottom: 10 }}>
                  <b>{members[s.member].name}</b>
                  <p className="mute" style={{ fontSize: 13 }}>
                    ✅ {s.done.slice(0, 2).join(", ") || "—"} · 🔄 {s.doing.join(", ") || "—"} {s.blocked.length > 0 && `· 🔒 ${s.blocked.join(", ")}`}
                  </p>
                </div>
              ))}
            </Gate>
          </div>
          <div className="card">
            <h2>Board insights</h2>
            <Gate id="AI-27">
              {boardInsights(tasks, history, members).map((s) => (
                <p key={s} style={{ marginBottom: 8 }}>
                  💡 {s}
                </p>
              ))}
            </Gate>
          </div>
        </div>
      )}

      {tab === "Reports" && (
        <div className="grid g2">
          <div className="card">
            <h2>Sprint retrospective</h2>
            <Gate id="ANL-12">
              <b>✅ Went well</b>
              <ul className="rl">{retro.wentWell.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>⚠️ Needs improvement</b>
              <ul className="rl">{retro.improve.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>🎯 Action items</b>
              <ul className="rl">{retro.actions.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>📚 Lessons learned</b>
              <ul className="rl">{retro.lessons.map((x) => <li key={x}>{x}</li>)}</ul>
            </Gate>
          </div>
          <div className="card">
            <h2>Weekly status report</h2>
            <Gate id="NOTIF-05">
              <pre className="doc-pre">{weekly}</pre>
              <div className="pill-row">
                <button
                  className="ghost sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(weekly);
                    toast("Report copied");
                  }}
                >
                  Copy
                </button>
                <button className="ghost sm" onClick={() => download("weekly-report.txt", weekly, "text/plain")}>
                  Download
                </button>
              </div>
            </Gate>
          </div>
          <div className="card">
            <h2>Process improvements</h2>
            <Gate id="AI-28">
              {processImprovements(tasks, history).map((s) => (
                <p key={s} style={{ marginBottom: 8 }}>
                  → {s}
                </p>
              ))}
            </Gate>
          </div>
          <div className="card">
            <h2>High-priority work forecast</h2>
            <Gate id="AI-11">
              <Bars values={[...bugWeeks, forecast]} labels={[...weekLabels, "Next wk"]} color="#E5483A" />
              <p className="mute" style={{ fontSize: 12 }}>
                Linear trend of high-priority items created per week. {can("AI-11") ? `Expect about ${forecast} next week.` : ""} Needs more history to be reliable.
              </p>
            </Gate>
          </div>
        </div>
      )}
    </>
  );
}
