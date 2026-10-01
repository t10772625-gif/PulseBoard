"use client";
import { useRouter } from "next/navigation";
import { useStore, health } from "@/lib/store";
import { ProjectId } from "@/types";
import { Avatar, Ecg, EmptyState, HealthBreakdown } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

export default function Projects() {
  const { tasks, projects, openNewProjectModal, allowed } = useStore();
  const router = useRouter();
  const { t: tt } = useT();
  const ids = Object.keys(projects) as ProjectId[];

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("nav.projects")}</h1>
          <p className="mute">{tt("projects.count", { n: ids.length })}</p>
        </div>
        {allowed("project.manage") && (
          <button className="btn" onClick={openNewProjectModal}>
            ＋ {tt("projects.new")}
          </button>
        )}
      </div>
      <div className="grid g3">
        {ids.length === 0 && (
          <EmptyState
            title={tt("dash.noProjects")}
            message={allowed("project.manage") ? tt("projects.emptyManage") : tt("projects.emptyView")}
            action={
              allowed("project.manage") ? (
                <button className="btn" onClick={openNewProjectModal}>
                  ＋ {tt("projects.new")}
                </button>
              ) : undefined
            }
          />
        )}
        {ids.map((k) => {
          const h = health(k, tasks);
          const projectTasks = tasks.filter((t) => t.projectId === k);
          const assignees = [...new Set(projectTasks.map((t) => t.assignee))];
          return (
            <button key={k} className="card pc" onClick={() => router.push(`/projects/${k}`)}>
              <div
                style={{
                  height: 64,
                  borderRadius: 12,
                  marginBottom: 14,
                  background: `linear-gradient(135deg, ${projects[k].color}, ${projects[k].gradient})`,
                }}
              />
              <div className="meta">
                <h2 style={{ margin: 0 }}>{projects[k].name}</h2>
                <span className="score" style={{ fontSize: 24, color: h.color }}>
                  {h.score}
                </span>
              </div>
              <p className="mute" style={{ margin: "4px 0 10px" }}>
                {projects[k].description || tt("projects.noDescription")}
              </p>
              <Ecg score={h.score} color={h.color} height={34} critical={h.critical} />
              <HealthBreakdown health={h} />
              <div className="sp" style={{ marginTop: 12 }}>
                <i style={{ width: `${h.total ? (h.done / h.total) * 100 : 0}%`, background: projects[k].color }} />
              </div>
              <div className="meta">
                <span className="mute">{tt("dash.pulseLine2", { done: h.done, total: h.total })}</span>
                <span className="stack">
                  {assignees.map((a) => (
                    <Avatar key={a} id={a} />
                  ))}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
