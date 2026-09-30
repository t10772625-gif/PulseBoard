"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { autoSchedule, detectDependencies, meetingToActions, nextActions, parseTaskText, smartMatch, sprintPlan } from "@/lib/ai";
import { MemberId, ProjectId } from "@/types";
import { Avatar } from "@/components/ui";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";

// Busy hours per person for the mock calendar (AI-22); 9–17 working day
const BUSY: Record<MemberId, number[]> = { me: [9, 13], ak: [10, 11, 15], ba: [9, 14], sm: [12, 16] };

export default function AiAssistant() {
  const s = useStore();
  const { tasks, members, projects, history, capacity, createTask, setTaskField, updateTask, openDrawer, toast, currentProjectId, spendAi, canEdit } = s;
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
          <h1>AI assistant</h1>
          <p className="mute">Rule-based helpers that run on your board data. Nothing is sent to an external AI service.</p>
        </div>
        <Dropdown value={project} onChange={setProject} options={Object.keys(projects).map((p) => ({ value: p, label: projects[p].name }))} />
      </div>

      <div className="grid g2">
        <div className="card">
          <h2>Create a task from a sentence</h2>
          <Gate id="AI-25">
            <input placeholder='e.g. "Fix checkout timeout tomorrow high for Bilal"' value={quick} onChange={(e) => setQuick(e.target.value)} />
            {quickParsed && (
              <div className="ai-out">
                <p>
                  <b>{quickParsed.title}</b>
                </p>
                <p className="mute" style={{ fontSize: 13 }}>
                  Due {dateForOffset(quickParsed.dueOffset)} · {PRIORITY_LABEL[quickParsed.priority]} ({quickParsed.priorityReason}) · Module {quickParsed.module} ·{" "}
                  {quickParsed.assignee ? members[quickParsed.assignee].name : "you"}
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
                    toast(`Created and assigned to ${members[assignee].name}`);
                    openDrawer(id);
                  }}
                >
                  Create
                </button>
              </div>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>Next best actions for you</h2>
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
          <h2>Meeting notes → action items</h2>
          <Gate id="AI-12">
            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste meeting notes or a transcript" />
            <button className="ghost sm" style={{ marginTop: 8 }} onClick={() => spendAi() && setMeetingOut(meetingToActions(notes, members))}>
              Extract action items
            </button>
            {meetingOut.length > 0 && (
              <div className="ai-out">
                {meetingOut.map((a, i) => (
                  <div key={i} className="sugg">
                    <span>
                      <b>{a.title}</b>
                      <br />
                      <span className="mute" style={{ fontSize: 12 }}>
                        {a.assignee ? members[a.assignee].name : "Unassigned"} · due {dateForOffset(a.dueOffset)} · {PRIORITY_LABEL[a.priority]}
                      </span>
                    </span>
                    <button
                      className="btn sm"
                      disabled={!canEdit}
                      onClick={() => {
                        createTask({ projectId: project, title: a.title, assignee: a.assignee ?? "me", dueOffset: a.dueOffset, priority: a.priority, labels: ["Meeting"] });
                        setMeetingOut((m) => m.filter((_, j) => j !== i));
                        toast("Task created");
                      }}
                    >
                      Create
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>Sprint auto-planning</h2>
          <Gate id="SPEC-27">
            <div className="pill-row" style={{ marginBottom: 8 }}>
              <label className="inline">
                Holidays in sprint
                <input type="number" min={0} max={9} style={{ width: 60 }} value={holidays} onChange={(e) => setHolidays(Math.max(0, Number(e.target.value)))} />
              </label>
            </div>
            <p className="mute" style={{ fontSize: 13 }}>
              Raw capacity {plan.raw}h · recent velocity {plan.velocityHours}h/2wk → plan up to <b>{plan.capacity}h</b>. Selected {plan.used}h.
            </p>
            {plan.plan.map((p) => (
              <button key={p.task.id} className="row" onClick={() => openDrawer(p.task.id)}>
                <span>{p.task.title}</span>
                <span className="mute">
                  {PRIORITY_LABEL[p.task.priority]} · {p.hours}h
                </span>
              </button>
            ))}
            {!plan.plan.length && <p className="mute">No to-do tasks in this project.</p>}
          </Gate>
        </div>

        <div className="card">
          <h2>Auto-schedule</h2>
          <Gate id="AI-17">
            <p className="mute" style={{ fontSize: 13, marginBottom: 6 }}>
              Open tasks ordered by priority and due date, 6 focused hours a day.
            </p>
            {schedule.map((x) => (
              <div key={x.task.id} className="sugg">
                <span>{x.task.title}</span>
                <span className="mute" style={{ fontSize: 12, color: x.late ? "var(--bad)" : undefined }}>
                  {dateForOffset(x.startOffset)} → {dateForOffset(x.endOffset)} ({x.hours}h){x.late ? " · misses due date" : ""}
                </span>
              </div>
            ))}
            {canEdit && schedule.length > 0 && (
              <button
                className="ghost sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  schedule.forEach((x) => updateTask(x.task.id, { barStart: x.startOffset, lengthDays: Math.max(1, x.endOffset - x.startOffset) }));
                  toast("Timeline updated from the schedule");
                }}
              >
                Apply to timeline
              </button>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>Resource allocation</h2>
          <Gate id="AI-26">
            <p className="mute" style={{ fontSize: 13, marginBottom: 6 }}>
              Best person for each to-do task by module experience and current load.
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
                    {t.assignee === best.member ? "✓" : "Assign"}
                  </button>
                </div>
              );
            })}
          </Gate>
        </div>

        <div className="card">
          <h2>Dependency detection</h2>
          <Gate id="AI-13">
            {deps.length ? (
              deps.map((d) => (
                <div key={d.from.id + d.to.id} className="sugg">
                  <span>
                    <b>{d.to.title}</b> may depend on <b>{d.from.title}</b>
                    <br />
                    <span className="mute" style={{ fontSize: 12 }}>
                      {d.reason}
                    </span>
                  </span>
                  <button
                    className="btn sm"
                    disabled={!canEdit}
                    onClick={() => {
                      updateTask(d.to.id, { blockedBy: d.from.id }, `Ali marked this as blocked by "${d.from.title}"`);
                      toast("Dependency set");
                    }}
                  >
                    Set
                  </button>
                </div>
              ))
            ) : (
              <p className="mute">No likely dependencies found.</p>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>Meeting scheduler</h2>
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
                <>
                  Everyone is free tomorrow at <b>{freeSlot}:00</b>.
                </>
              ) : (
                "No common free hour tomorrow."
              )}
            </p>
            {freeSlot !== undefined && canEdit && (
              <button
                className="btn sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  createTask({ projectId: project, title: `Team meeting ${freeSlot}:00`, dueOffset: 1, labels: ["Meeting"], description: `Invitees: ${invitees.map((m) => members[m].name).join(", ")}` });
                  toast("Meeting added as a task (calendar invites need the Google Calendar integration)");
                }}
              >
                Book it
              </button>
            )}
            <p className="mute" style={{ fontSize: 12, marginTop: 6 }}>Demo calendars. Real availability needs a calendar connection.</p>
          </Gate>
        </div>

        <div className="card">
          <h2>Competitor issue tracker</h2>
          <Gate id="AI-15">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
              ⚠️ Sample data only. Monitoring real social/app-store mentions needs API access that isn&apos;t set up.
            </p>
            {[
              ["XYZ App", "Payments", 10, "App Store"],
              ["XYZ App", "Login", 4, "Reddit"],
              ["Acme PM", "Sync", 6, "Twitter"],
            ].map(([c, area, n, src]) => (
              <div key={`${c}${area}`} className="sugg">
                <span>
                  <b>{c}</b>: {n} {area} complaints ({src})
                </span>
                <span className="chip">Opportunity: market our {String(area).toLowerCase()}</span>
              </div>
            ))}
          </Gate>
        </div>
      </div>
    </>
  );
}
