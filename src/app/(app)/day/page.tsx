"use client";
import { DragEvent } from "react";
import { useStore } from "@/lib/store";
import { DueLabel } from "@/components/ui";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function MyDay() {
  const { tasks, daySchedule, scheduleTask, unscheduleTask, timerSeconds, timerRunning, toggleTimer, openDrawer } = useStore();

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
          <h1>My Day</h1>
          <p className="mute">Drag tasks into time blocks. Plan only what you can really finish.</p>
        </div>
        <span className="chip">{plannedHours}h planned of 6h focus time</span>
      </div>
      <div className="day">
        <div className="grid" style={{ alignContent: "start" }}>
          <div className="card">
            <h2>Focus timer</h2>
            <div className="timer">
              {mm}:{ss}
            </div>
            <p className="mute" style={{ margin: "6px 0 12px" }}>
              {current ? current.title : "Pick a task first"}
            </p>
            <button className="btn" onClick={toggleTimer}>
              {timerRunning ? "Pause" : "Start focus"}
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
            <h2>Up next</h2>
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
              <p className="mute">Everything is scheduled.</p>
            )}
          </div>
        </div>
        <div className="card">
          {HOURS.map((h) => {
            const taskId = daySchedule[h];
            const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;
            return (
              <div className="slot" key={h}>
                <span className="mute">{h}:00</span>
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
                      <button aria-label="Remove" onClick={() => unscheduleTask(h)}>
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
    </>
  );
}
