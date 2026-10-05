"use client";
import { useState } from "react";
import { CalendarClock, CalendarRange, Gauge, Info, ListTodo } from "lucide-react";
import { useStore } from "@/lib/store";
import { dateForOffset } from "@/lib/mock-data";
import { autoSchedule, sprintPlan } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { EmptyState, PriorityTag } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

// SPEC-27 sprint plan, AI-17 auto-scheduling for the chosen board. Rule-based
// estimates from the board's own history; nothing changes until "Apply" is pressed.
export default function AiPlanning() {
  const { tasks, members, history, updateTask, openDrawer, toast, canEdit } = useStore();
  const { t: tt, fmt } = useT();
  const { project, picker } = useProjectPicker();
  const [holidays, setHolidays] = useState(0);
  const projectTasks = tasks.filter((t) => t.projectId === project);
  const plan = sprintPlan(projectTasks, history, Object.values(members).filter((m) => m.role !== "Viewer").length, 10, holidays);
  const schedule = autoSchedule(projectTasks, history);
  const late = schedule.filter((x) => x.late).length;

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[2]} hint={tt("aiPage.hint")} />
      <div className="ux-page">
        <FeatureHero id="aip-hero" icon={CalendarRange} title={tt("aip.heroTitle")} text={tt("aip.heroText")} status="available" statusText={tt("ux.ruleBased")} planId="SPEC-27">
          <div className="ux-pills">{picker}</div>
        </FeatureHero>
        <HowItWorks
          id="aip-how"
          steps={[
            { title: tt("aip.s1"), text: tt("aip.s1t") },
            { title: tt("aip.s2"), text: tt("aip.s2t") },
            { title: tt("aip.s3"), text: tt("aip.s3t") },
          ]}
        />

        <section className="card ux-sec" aria-labelledby="aip-sprint">
          <SecHead id="aip-sprint" icon={Gauge} title={tt("aiPage.sprint")}>
            <span className="ux-conf">{tt("aip.estimate")}</span>
          </SecHead>
          <Gate id="SPEC-27">
            <div className="ux-form">
              <div className="ux-inline">
                <label style={{ flex: "0 1 200px" }}>
                  {tt("aiPage.holidays")}
                  <input type="number" min={0} max={9} value={holidays} onChange={(e) => setHolidays(Math.min(9, Math.max(0, Number(e.target.value) || 0)))} />
                </label>
              </div>
              <div className="ux-tiles">
                <div className="ux-tile">
                  <small className="mute">{tt("aip.tileCapacity")}</small>
                  <b>{tt("aiPage.hours", { n: fmt.number(plan.capacity) })}</b>
                </div>
                <div className="ux-tile">
                  <small className="mute">{tt("aip.tileVelocity")}</small>
                  <b>{tt("aiPage.hours", { n: fmt.number(plan.velocityHours) })}</b>
                </div>
                <div className="ux-tile">
                  <small className="mute">{tt("aip.tilePicked")}</small>
                  <b>{fmt.number(plan.plan.length)}</b>
                </div>
                <div className="ux-tile">
                  <small className="mute">{tt("aip.tileUsed")}</small>
                  <b>{tt("aiPage.hours", { n: fmt.number(plan.used) })}</b>
                </div>
              </div>
              {plan.plan.length ? (
                <div className="ux-table-wrap">
                  <table className="ux-table">
                    <thead>
                      <tr>
                        <th scope="col">{tt("aip.colTask")}</th>
                        <th scope="col">{tt("aip.colPriority")}</th>
                        <th scope="col">{tt("aip.colHours")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.plan.map((p) => (
                        <tr key={p.task.id}>
                          <td>
                            <button className="link" style={{ textAlign: "start" }} onClick={() => openDrawer(p.task.id)}>
                              {p.task.title}
                            </button>
                          </td>
                          <td>
                            <PriorityTag p={p.task.priority} />
                          </td>
                          <td className="mute">{tt("aiPage.hours", { n: p.hours })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState compact icon={<ListTodo size={26} />} title={tt("aiPage.noTodo")} message={tt("aip.noTodoText")} />
              )}
            </div>
            <p className="mute st-foot">
              <Info size={14} aria-hidden /> {tt("aip.howCapacity", { raw: plan.raw })}
            </p>
          </Gate>
        </section>

        <section className="card ux-sec" aria-labelledby="aip-sched">
          <SecHead id="aip-sched" icon={CalendarClock} title={tt("aiPage.schedule")}>
            {late > 0 && <span className="int-st setup">{tt("aip.lateCount", { n: late })}</span>}
          </SecHead>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {tt("aiPage.scheduleHint")}
          </p>
          <Gate id="AI-17">
            {schedule.length ? (
              <>
                <div className="ux-table-wrap">
                  <table className="ux-table">
                    <thead>
                      <tr>
                        <th scope="col">{tt("aip.colTask")}</th>
                        <th scope="col">{tt("aip.colWhen")}</th>
                        <th scope="col">{tt("aip.colHours")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((x) => (
                        <tr key={x.task.id}>
                          <td>
                            <button className="link" style={{ textAlign: "start" }} onClick={() => openDrawer(x.task.id)}>
                              {x.task.title}
                            </button>
                            {x.late && (
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--bad)" }}>
                                {tt("aip.missesDue")}
                              </p>
                            )}
                          </td>
                          <td className="mute" style={{ whiteSpace: "nowrap" }}>
                            {dateForOffset(x.startOffset)} → {dateForOffset(x.endOffset)}
                          </td>
                          <td className="mute">{tt("aiPage.hours", { n: x.hours })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {canEdit && (
                  <div className="ux-actions">
                    <span className="mute" style={{ fontSize: 12, marginInlineEnd: "auto" }}>
                      {tt("ux.reviewFirst")}
                    </span>
                    <button
                      className="btn"
                      onClick={() => {
                        schedule.forEach((x) => updateTask(x.task.id, { barStart: x.startOffset, lengthDays: Math.max(1, x.endOffset - x.startOffset) }));
                        toast(tt("aiPage.timelineUpdated"));
                      }}
                    >
                      <CalendarClock size={16} aria-hidden /> {tt("aiPage.applyTimeline")}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState compact icon={<CalendarClock size={26} />} title={tt("aip.noOpen")} message={tt("aip.noOpenText")} />
            )}
          </Gate>
        </section>
      </div>
    </>
  );
}
