"use client";
import { DragEvent, useState } from "react";
import { useStore } from "@/lib/store";
import { moduleName, taskModule } from "@/lib/ai";
import { DueLabel } from "@/components/ui";
import Gate from "@/components/Gate";
import { useT } from "@/i18n/I18nProvider";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function MyDay() {
  const { tasks, daySchedule, scheduleTask, unscheduleTask, timerSeconds, timerRunning, toggleTimer, openDrawer } = useStore();
  const { t: tt, fmt } = useT();

  const scheduledIds = new Set(Object.values(daySchedule));
  const mine = tasks.filter((t) => t.assignee === "me" && t.status !== "done" && !scheduledIds.has(t.id));
  const plannedHours = Object.keys(daySchedule).length;
  const firstHour = Object.keys(daySchedule)
    .map(Number)
    .sort((a, b) => a - b)[0];
  const current = firstHour !== undefined ? tasks.find((t) => t.id === daySchedule[firstHour]) : undefined;

  const mm = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const ss = String(timerSeconds % 60).padStart(2, "0");

  function onDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.currentTarget.classList.add("dragging");
  }
  function onDragEnd(e: DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove("dragging");
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("day.title")}</h1>
          <p className="mute">{tt("day.hint")}</p>
        </div>
        <span className="chip">{tt("day.planned", { n: plannedHours })}</span>
      </div>
      <div className="day">
        <div className="grid" style={{ alignContent: "start" }}>
          <div className="card">
            <h2>{tt("day.timer")}</h2>
            <div className="timer" dir="ltr">
              {mm}:{ss}
            </div>
            <p className="mute" style={{ margin: "6px 0 12px" }}>
              {current ? current.title : tt("day.pickTask")}
            </p>
            <button className="btn" onClick={toggleTimer}>
              {timerRunning ? tt("day.pause") : tt("day.startFocus")}
            </button>
          </div>
          <div
            className="card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              const hour = Object.keys(daySchedule).find((h) => daySchedule[Number(h)] === id);
              if (hour !== undefined) unscheduleTask(Number(hour));
            }}
          >
            <h2>{tt("day.upNext")}</h2>
            {mine.length ? (
              mine.map((t) => (
                <div
                  key={t.id}
                  className="sch"
                  draggable
                  style={{ marginBottom: 8 }}
                  onDragStart={(e) => onDragStart(e, t.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => openDrawer(t.id)}
                >
                  <span>{t.title}</span>
                  <DueLabel task={t} />
                </div>
              ))
            ) : (
              <p className="mute">{tt("day.allScheduled")}</p>
            )}
          </div>
        </div>
        <div className="card">
          {HOURS.map((h) => {
            const taskId = daySchedule[h];
            const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;
            return (
              <div className="slot" key={h}>
                <span className="mute">{fmt.time(new Date(2026, 0, 1, h), { hour: "numeric", minute: "2-digit" })}</span>
                <div
                  className="z"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("over");
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("over")}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("over");
                    const id = e.dataTransfer.getData("text/plain");
                    scheduleTask(h, id);
                  }}
                >
                  {task && (
                    <div className="sch" draggable onDragStart={(e) => onDragStart(e, task.id)} onDragEnd={onDragEnd}>
                      <span onClick={() => openDrawer(task.id)}>{task.title}</span>
                      <button aria-label={tt("day.remove")} onClick={() => unscheduleTask(h)}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DayExtras />
    </>
  );
}

// Energy planning (TIME-07), task batching (TIME-06), async standup (SPEC-24),
// and the personal context-switch count (TIME-08).
function DayExtras() {
  const { tasks, daySchedule, scheduleTask, openDrawer, taskSwitches, standups, postStandup, members, toast, can } = useStore();
  const { t: tt } = useT();
  const [y, setY] = useState(standups.me?.yesterday ?? "");
  const [td, setTd] = useState(standups.me?.today ?? "");
  const [bl, setBl] = useState(standups.me?.blockers ?? "");
  const mine = tasks.filter((t) => t.assignee === "me" && t.status !== "done");
  const batches = Object.entries(
    mine.reduce<Record<string, typeof mine>>((acc, t) => {
      const m = taskModule(t);
      (acc[m] ||= []).push(t);
      return acc;
    }, {})
  ).sort((a, b) => b[1].length - a[1].length);

  function planByEnergy() {
    const free = HOURS.filter((h) => !daySchedule[h]);
    const scheduled = new Set(Object.values(daySchedule));
    const rank = (t: (typeof mine)[number]) => (t.energy === "high" ? 0 : t.energy === "low" ? 2 : 1) * 10 + "hml".indexOf(t.priority);
    const queue = mine.filter((t) => !scheduled.has(t.id)).sort((a, b) => rank(a) - rank(b));
    // Morning slots get high-energy work, afternoons get the rest
    free.forEach((h, i) => queue[i] && scheduleTask(h, queue[i].id));
    toast(queue.length ? tt("day.planned2") : tt("day.nothingLeft"));
  }

  return (
    <div className="grid g2" style={{ marginTop: 18 }}>
      <div className="card">
        <h2>{tt("day.energyTitle")}</h2>
        <Gate id="TIME-07">
          <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
            {tt("day.energyHint")}
          </p>
          <button className="btn sm" onClick={planByEnergy}>
            {tt("day.autoFill")}
          </button>
        </Gate>
      </div>
      <div className="card">
        <h2>{tt("day.batchTitle")}</h2>
        <Gate id="TIME-06">
          {batches.map(([m, list]) => (
            <div key={m} style={{ marginBottom: 8 }}>
              <b>{moduleName(m)}</b> <span className="mute">({list.length})</span>
              <p style={{ fontSize: 13 }}>
                {list.map((t, i) => (
                  <span key={t.id}>
                    {i > 0 && " · "}
                    <button className="link" onClick={() => openDrawer(t.id)}>
                      {t.title}
                    </button>
                  </span>
                ))}
              </p>
            </div>
          ))}
          <p className="mute" style={{ fontSize: 12 }}>{tt("day.batchHint")}</p>
        </Gate>
      </div>
      <div className="card">
        <h2>{tt("day.standupTitle")}</h2>
        <Gate id="SPEC-24">
          <div style={{ display: "grid", gap: 8 }}>
            <input placeholder={tt("day.yesterday")} value={y} onChange={(e) => setY(e.target.value)} />
            <input placeholder={tt("day.today")} value={td} onChange={(e) => setTd(e.target.value)} />
            <input placeholder={tt("day.blockers")} value={bl} onChange={(e) => setBl(e.target.value)} />
            <button
              className="btn sm"
              onClick={() => {
                if (!td.trim()) return toast(tt("day.addToday"));
                postStandup({ yesterday: y, today: td, blockers: bl });
                toast(tt("day.posted"));
              }}
            >
              {tt("day.post")}
            </button>
          </div>
          <div className="ai-out">
            {(Object.keys(standups) as (keyof typeof standups)[]).map((m) => {
              const u = standups[m]!;
              return (
                <p key={m} style={{ fontSize: 13, marginBottom: 6 }}>
                  <b>{members[m].name}:</b> {u.today}
                  {u.blockers && <span style={{ color: "var(--bad)" }}> · 🔒 {u.blockers}</span>}
                </p>
              );
            })}
          </div>
        </Gate>
      </div>
      <div className="card">
        <h2>{tt("day.focusToday")}</h2>
        {can("TIME-08") ? (
          <>
            <div className="stat">{taskSwitches}</div>
            <p className="mute" style={{ fontSize: 13 }}>
              {tt("day.switches", { tip: taskSwitches > 10 ? tt("day.tryBatch") : tt("day.focused") })}
            </p>
          </>
        ) : (
          <Gate id="TIME-08">{null}</Gate>
        )}
        <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>{tt("day.timerMutes")}</p>
      </div>
    </div>
  );
}
