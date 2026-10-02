"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { autoSchedule, sprintPlan } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// SPEC-27 sprint plan, AI-17 auto-scheduling for the chosen project
export default function AiPlanning() {
  const { tasks, members, history, updateTask, openDrawer, toast, canEdit } = useStore();
  const { t: tt, rich } = useT();
  const { project, picker } = useProjectPicker();
  const [holidays, setHolidays] = useState(0);
  const projectTasks = tasks.filter((t) => t.projectId === project);
  const plan = sprintPlan(projectTasks, history, Object.values(members).filter((m) => m.role !== "Viewer").length, 10, holidays);
  const schedule = autoSchedule(projectTasks, history);

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[2]} hint={tt("aiPage.hint")} actions={picker} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("aiPage.sprint")}</h2>
          <Gate id="SPEC-27">
            <div className="pill-row" style={{ marginBottom: 8 }}>
              <label className="inline">
                {tt("aiPage.holidays")}
                <input type="number" min={0} max={9} style={{ width: 60 }} value={holidays} onChange={(e) => setHolidays(Math.max(0, Number(e.target.value)))} />
              </label>
            </div>
            <p className="mute" style={{ fontSize: 13 }}>
              {rich("aiPage.capacityLine", { raw: plan.raw, velocity: plan.velocityHours, cap: plan.capacity, used: plan.used })}
            </p>
            {plan.plan.map((p) => (
              <button key={p.task.id} className="row" onClick={() => openDrawer(p.task.id)}>
                <span>{p.task.title}</span>
                <span className="mute">
                  {PRIORITY_LABEL[p.task.priority]} · {tt("aiPage.hours", { n: p.hours })}
                </span>
              </button>
            ))}
            {!plan.plan.length && <p className="mute">{tt("aiPage.noTodo")}</p>}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.schedule")}</h2>
          <Gate id="AI-17">
            <p className="mute" style={{ fontSize: 13, marginBottom: 6 }}>
              {tt("aiPage.scheduleHint")}
            </p>
            {schedule.map((x) => (
              <div key={x.task.id} className="sugg">
                <span>{x.task.title}</span>
                <span className="mute" style={{ fontSize: 12, color: x.late ? "var(--bad)" : undefined }}>
                  {dateForOffset(x.startOffset)} → {dateForOffset(x.endOffset)} ({tt("aiPage.hours", { n: x.hours })})
                  {x.late ? tt("aiPage.missesDue") : ""}
                </span>
              </div>
            ))}
            {canEdit && schedule.length > 0 && (
              <button
                className="ghost sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  schedule.forEach((x) => updateTask(x.task.id, { barStart: x.startOffset, lengthDays: Math.max(1, x.endOffset - x.startOffset) }));
                  toast(tt("aiPage.timelineUpdated"));
                }}
              >
                {tt("aiPage.applyTimeline")}
              </button>
            )}
          </Gate>
        </div>
      </div>
    </>
  );
}
