"use client";
import { useStore } from "@/lib/store";
import { smartMatch } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import { Avatar } from "@/components/ui";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// AI-26 resource allocation: best person per to-do task in the chosen project
export default function AiAssign() {
  const { tasks, members, history, capacity, setTaskField, canEdit } = useStore();
  const { t: tt } = useT();
  const { project, picker } = useProjectPicker();
  const todo = tasks.filter((t) => t.projectId === project && t.status === "todo");

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[3]} hint={tt("aiPage.hint")} actions={picker} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("aiPage.resources")}</h2>
          <Gate id="AI-26">
            <p className="mute" style={{ fontSize: 13, marginBottom: 6 }}>
              {tt("aiPage.resourcesHint")}
            </p>
            {todo.map((t) => {
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
      </div>
    </>
  );
}
