"use client";
import { useStore } from "@/lib/store";
import { detectDependencies, nextActions } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";

// AI-19 next actions, AI-13 dependency detection (all projects)
export default function AiSuggestions() {
  const { tasks, members, updateTask, openDrawer, toast, canEdit } = useStore();
  const { t: tt, rich } = useT();
  const me = members.me?.name.split(" ")[0] ?? tt("common.you");
  const deps = detectDependencies(tasks);

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[1]} hint={tt("aiPage.hint")} />
      <div className="grid g2">
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
      </div>
    </>
  );
}
