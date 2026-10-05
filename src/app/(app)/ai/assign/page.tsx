"use client";
import { ArrowUpRight, Check, ListTodo, UserCheck, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { smartMatch } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import { Avatar, EmptyState } from "@/components/ui";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// AI-26 resource allocation: best person per to-do task in the chosen board.
// Rule-based (module experience + current load); a person always confirms each assignment.
export default function AiAssign() {
  const { tasks, members, history, capacity, setTaskField, openDrawer, canEdit } = useStore();
  const { t: tt } = useT();
  const { project, picker } = useProjectPicker();
  const todo = tasks.filter((t) => t.projectId === project && t.status === "todo");
  const rows = todo.map((t) => ({ task: t, best: smartMatch(t, tasks, history, members, capacity).results[0] })).filter((r) => r.best);

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[3]} hint={tt("aiPage.hint")} />
      <div className="ux-page">
        <FeatureHero id="asg-hero" icon={UserCheck} title={tt("asg.heroTitle")} text={tt("asg.heroText")} status="available" statusText={tt("ux.ruleBased")} planId="AI-26">
          <div className="ux-pills">{picker}</div>
        </FeatureHero>
        <HowItWorks
          id="asg-how"
          steps={[
            { title: tt("asg.s1"), text: tt("asg.s1t") },
            { title: tt("asg.s2"), text: tt("asg.s2t") },
            { title: tt("asg.s3"), text: tt("asg.s3t") },
          ]}
        />

        <section className="card ux-sec" aria-labelledby="asg-list">
          <SecHead id="asg-list" icon={Users} title={tt("aiPage.resources")}>
            <span className="ux-conf">{tt("ux.reviewFirst")}</span>
          </SecHead>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {tt("aiPage.resourcesHint")}
          </p>
          <Gate id="AI-26">
            {rows.length ? (
              <div className="grid g2">
                {rows.map(({ task: t, best }) => {
                  const done = t.assignee === best!.member;
                  return (
                    <div key={t.id} className="ux-result" style={{ marginTop: 0 }}>
                      <b>{t.title}</b>
                      <span className="ux-actor">
                        <Avatar id={best!.member} /> <span>{members[best!.member].name}</span>
                      </span>
                      <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                        {best!.reason}
                      </p>
                      <div className="ux-actions">
                        <button className="ghost sm" onClick={() => openDrawer(t.id)}>
                          <ArrowUpRight size={14} aria-hidden className="flip-rtl" /> {tt("aisg.openTask")}
                        </button>
                        <button className={done ? "ghost sm" : "btn sm"} disabled={done || !canEdit} onClick={() => setTaskField(t.id, "assignee", best!.member)}>
                          <Check size={14} aria-hidden /> {done ? tt("asg.assigned") : tt("drawer.assign")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState compact icon={<ListTodo size={26} />} title={tt("asg.empty")} message={tt("asg.emptyText")} />
            )}
          </Gate>
        </section>
      </div>
    </>
  );
}
