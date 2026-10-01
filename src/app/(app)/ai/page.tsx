"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { autoSchedule, detectDependencies, meetingToActions, moduleName, nextActions, parseTaskText, smartMatch, sprintPlan } from "@/lib/ai";
import { MemberId, ProjectId } from "@/types";
import { Avatar } from "@/components/ui";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { useT } from "@/i18n/I18nProvider";

// Busy hours per person for the mock calendar (AI-22); 9–17 working day
const BUSY: Record<MemberId, number[]> = { me: [9, 13], ak: [10, 11, 15], ba: [9, 14], sm: [12, 16] };

export default function AiAssistant() {
  const s = useStore();
  const { tasks, members, projects, history, capacity, createTask, setTaskField, updateTask, openDrawer, toast, currentProjectId, spendAi, canEdit } = s;
  const { t: tt, rich, fmt } = useT();
  const me = members.me?.name.split(" ")[0] ?? tt("common.you");
  const hourLabel = (h: number) => fmt.time(new Date(2026, 0, 1, h), { hour: "numeric", minute: "2-digit" });
  const [project, setProject] = useState<ProjectId>(currentProjectId);
  const [quick, setQuick] = useState("");
  const [notes, setNotes] = useState("Ayesha to review the pricing page copy by Friday.\nBilal fix the login crash tomorrow, high priority.\nSara prepare release notes next week.\nWe talked about the new logo.");
  const [meetingOut, setMeetingOut] = useState<ReturnType<typeof meetingToActions>>([]);
  const [holidays, setHolidays] = useState(0);
  const [invitees, setInvitees] = useState<MemberId[]>(["me", "ak", "ba"]);

  const quickParsed = quick.trim() ? parseTaskText(quick, members) : null;
  const projectTasks = tasks.filter((t) => t.projectId === project);
  const plan = sprintPlan(projectTasks, history, Object.values(members).filter((m) => m.role !== "Viewer").length, 10, holidays);
  const schedule = autoSchedule(projectTasks, history);
  const deps = detectDependencies(tasks);
  const unassignedLike = projectTasks.filter((t) => t.status === "todo");
  const freeSlot = [9, 10, 11, 12, 13, 14, 15, 16].find((h) => invitees.every((m) => !(BUSY[m] ?? []).includes(h)));

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("aiPage.title")}</h1>
          <p className="mute">{tt("aiPage.hint")}</p>
        </div>
        <Dropdown value={project} onChange={setProject} options={Object.keys(projects).map((p) => ({ value: p, label: projects[p].name }))} />
      </div>

      <div className="grid g2">
        <div className="card">
          <h2>{tt("aiPage.sentence")}</h2>
          <Gate id="AI-25">
            <input placeholder={tt("aiPage.sentencePlaceholder")} value={quick} onChange={(e) => setQuick(e.target.value)} />
            <p className="mute" style={{ fontSize: 12, marginTop: 4 }}>
              {tt("aiPage.sentenceLang")}
            </p>
            {quickParsed && (
              <div className="ai-out">
                <p>
                  <b>{quickParsed.title}</b>
                </p>
                <p className="mute" style={{ fontSize: 13 }}>
                  {tt("aiPage.parsed", {
                    date: dateForOffset(quickParsed.dueOffset),
                    priority: PRIORITY_LABEL[quickParsed.priority],
                    reason: quickParsed.priorityReason,
                    module: moduleName(quickParsed.module),
                    who: quickParsed.assignee ? members[quickParsed.assignee].name : tt("aiPage.you"),
                  })}
                </p>
                <button
                  className="btn sm"
                  disabled={!canEdit}
                  onClick={() => {
                    if (!spendAi()) return;
                    const q = quickParsed;
                    const assignee = q.assignee ?? smartMatch({ id: "", title: q.title, description: "", labels: q.labels, module: q.module }, tasks, history, members, capacity).results[0]?.member ?? "me";
                    const id = createTask({ projectId: project, title: q.title, priority: q.priority, dueOffset: q.dueOffset, labels: q.labels, assignee, module: q.module });
                    setQuick("");
                    toast(tt("aiPage.createdAssigned", { name: members[assignee].name }));
                    openDrawer(id);
                  }}
                >
                  {tt("common.create")}
                </button>
              </div>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.nextActions")}</h2>
          <Gate id="AI-19">
            {nextActions(tasks).map((a) => (
              <button key={a.taskId} className="row" onClick={() => openDrawer(a.taskId)}>
                <span>{a.text}</span>
                <span className="mute" style={{ fontSize: 12 }}>
                  {a.why}
                </span>
              </button>
            ))}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.meeting")}</h2>
          <Gate id="AI-12">
            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tt("aiPage.meetingPlaceholder")} />
            <button className="ghost sm" style={{ marginTop: 8 }} onClick={() => spendAi() && setMeetingOut(meetingToActions(notes, members))}>
              {tt("aiPage.extract")}
            </button>
            {meetingOut.length > 0 && (
              <div className="ai-out">
                {meetingOut.map((a, i) => (
                  <div key={i} className="sugg">
                    <span>
                      <b>{a.title}</b>
                      <br />
                      <span className="mute" style={{ fontSize: 12 }}>
                        {tt("aiPage.itemLine", { who: a.assignee ? members[a.assignee].name : tt("common.unassigned"), date: dateForOffset(a.dueOffset), priority: PRIORITY_LABEL[a.priority] })}
                      </span>
                    </span>
                    <button
                      className="btn sm"
                      disabled={!canEdit}
                      onClick={() => {
                        createTask({ projectId: project, title: a.title, assignee: a.assignee ?? "me", dueOffset: a.dueOffset, priority: a.priority, labels: ["Meeting"] });
                        setMeetingOut((m) => m.filter((_, j) => j !== i));
                        toast(tt("aiPage.taskCreated"));
                      }}
                    >
                      {tt("common.create")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Gate>
        </div>

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

        <div className="card">
          <h2>{tt("aiPage.resources")}</h2>
          <Gate id="AI-26">
            <p className="mute" style={{ fontSize: 13, marginBottom: 6 }}>
              {tt("aiPage.resourcesHint")}
            </p>
            {unassignedLike.map((t) => {
              const best = smartMatch(t, tasks, history, members, capacity).results[0];
              if (!best) return null;
              return (
                <div key={t.id} className="sugg">
                  <span>
                    {t.title}
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      <Avatar id={best.member} /> {members[best.member].name} · {best.reason}
                    </span>
                  </span>
                  <button className="btn sm" disabled={t.assignee === best.member || !canEdit} onClick={() => setTaskField(t.id, "assignee", best.member)}>
                    {t.assignee === best.member ? "✓" : tt("drawer.assign")}
                  </button>
                </div>
              );
            })}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.deps")}</h2>
          <Gate id="AI-13">
            {deps.length ? (
              deps.map((d) => (
                <div key={d.from.id + d.to.id} className="sugg">
                  <span>
                    {rich("aiPage.mayDepend", { to: d.to.title, from: d.from.title })}
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      {d.reason}
                    </span>
                  </span>
                  <button
                    className="btn sm"
                    disabled={!canEdit}
                    onClick={() => {
                      updateTask(d.to.id, { blockedBy: d.from.id }, tt("drawer.actBlocked", { name: me, title: d.from.title }));
                      toast(tt("aiPage.depSet"));
                    }}
                  >
                    {tt("aiPage.set")}
                  </button>
                </div>
              ))
            ) : (
              <p className="mute">{tt("aiPage.noDeps")}</p>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.scheduler")}</h2>
          <Gate id="AI-22">
            <div className="pill-row" style={{ marginBottom: 8 }}>
              {(Object.keys(members) as MemberId[]).map((m) => (
                <label key={m} className="inline">
                  <input type="checkbox" checked={invitees.includes(m)} onChange={() => setInvitees((v) => (v.includes(m) ? v.filter((x) => x !== m) : [...v, m]))} />
                  {members[m].name.split(" ")[0]}
                </label>
              ))}
            </div>
            <p>
              {freeSlot !== undefined ? (
                rich("aiPage.freeAt", { time: hourLabel(freeSlot) })
              ) : (
                tt("aiPage.noFree")
              )}
            </p>
            {freeSlot !== undefined && canEdit && (
              <button
                className="btn sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  createTask({ projectId: project, title: tt("aiPage.meetingTitle", { time: hourLabel(freeSlot) }), dueOffset: 1, labels: ["Meeting"], description: tt("aiPage.invitees", { names: invitees.map((m) => members[m].name).join(", ") }) });
                  toast(tt("aiPage.meetingAdded"));
                }}
              >
                {tt("aiPage.book")}
              </button>
            )}
            <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>{tt("aiPage.demoCalendars")}</p>
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.competitor")}</h2>
          <Gate id="AI-15">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
              {tt("aiPage.competitorNote")}
            </p>
            {[
              ["XYZ App", "Payments", 10, "App Store"],
              ["XYZ App", "Login", 4, "Reddit"],
              ["Acme PM", "Sync", 6, "Twitter"],
            ].map(([c, area, n, src]) => (
              <div key={`${c}${area}`} className="sugg">
                <span>
                  {rich("aiPage.complaints", { company: String(c), n: Number(n), area: String(area), source: String(src) })}
                </span>
                <span className="chip">{tt("aiPage.opportunity", { area: String(area).toLowerCase() })}</span>
              </div>
            ))}
          </Gate>
        </div>
      </div>
    </>
  );
}
