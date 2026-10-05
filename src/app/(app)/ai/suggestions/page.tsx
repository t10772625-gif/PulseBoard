"use client";
import { ArrowUpRight, Check, GitMerge, Lightbulb, ListChecks } from "lucide-react";
import { useStore } from "@/lib/store";
import { detectDependencies, nextActions } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

// AI-19 next actions, AI-13 dependency detection (all boards). Rule-based: reads the
// workspace's own tasks in the browser. Suggestions are never applied automatically.
export default function AiSuggestions() {
  const { tasks, members, updateTask, openDrawer, toast, canEdit } = useStore();
  const { t: tt, rich } = useT();
  const me = members.me?.name.split(" ")[0] ?? tt("common.you");
  const actions = nextActions(tasks);
  const deps = detectDependencies(tasks);

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[1]} hint={tt("aiPage.hint")} />
      <div className="ux-page">
        <FeatureHero id="ais-hero" icon={Lightbulb} title={tt("aisg.heroTitle")} text={tt("aisg.heroText")} status="available" statusText={tt("ux.ruleBased")} planId="AI-19" />
        <HowItWorks
          id="ais-how"
          steps={[
            { title: tt("aisg.s1"), text: tt("aisg.s1t") },
            { title: tt("aisg.s2"), text: tt("aisg.s2t") },
            { title: tt("aisg.s3"), text: tt("aisg.s3t") },
          ]}
        />

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="ais-next">
            <SecHead id="ais-next" icon={ListChecks} title={tt("aiPage.nextActions")}>
              <span className="ux-conf">{tt("aisg.count", { n: actions.length })}</span>
            </SecHead>
            <Gate id="AI-19">
              {actions.length ? (
                <div>
                  {actions.map((a) => (
                    <div key={a.taskId} className="ux-result">
                      <b>{a.text}</b>
                      <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                        {a.why}
                      </p>
                      <div className="ux-actions">
                        <button className="ghost sm" onClick={() => openDrawer(a.taskId)}>
                          <ArrowUpRight size={14} aria-hidden className="flip-rtl" /> {tt("aisg.openTask")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon={<Check size={26} />} title={tt("aisg.noActions")} message={tt("aisg.noActionsText")} />
              )}
            </Gate>
          </section>

          <section className="card ux-sec" aria-labelledby="ais-deps">
            <SecHead id="ais-deps" icon={GitMerge} title={tt("aiPage.deps")}>
              <span className="ux-conf">{tt("aisg.count", { n: deps.length })}</span>
            </SecHead>
            <Gate id="AI-13">
              {deps.length ? (
                <div>
                  {deps.map((d) => (
                    <div key={d.from.id + d.to.id} className="ux-result">
                      <div className="ux-pills">
                        <span className="ux-conf">{tt("aisg.possible")}</span>
                      </div>
                      <span>{rich("aiPage.mayDepend", { to: d.to.title, from: d.from.title })}</span>
                      <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                        {d.reason}
                      </p>
                      <div className="ux-actions">
                        <button className="ghost sm" onClick={() => openDrawer(d.to.id)}>
                          <ArrowUpRight size={14} aria-hidden className="flip-rtl" /> {tt("aisg.openTask")}
                        </button>
                        <button
                          className="ghost sm"
                          disabled={!canEdit}
                          onClick={() => {
                            updateTask(d.to.id, { blockedBy: d.from.id }, tt("drawer.actBlocked", { name: me, title: d.from.title }));
                            toast(tt("aiPage.depSet"));
                          }}
                        >
                          <Check size={14} aria-hidden /> {tt("aisg.apply")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon={<GitMerge size={26} />} title={tt("aiPage.noDeps")} message={tt("aisg.noDepsText")} />
              )}
            </Gate>
          </section>
        </div>
      </div>
    </>
  );
}
