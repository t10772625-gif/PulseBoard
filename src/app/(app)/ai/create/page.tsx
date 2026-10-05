"use client";
import { useState } from "react";
import Link from "next/link";
import { ListTodo, NotebookPen, Plus, Sparkles, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { meetingToActions, moduleName, parseTaskText, smartMatch } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import type { AiDraft } from "@/lib/integrations";
import { MemberId, Priority } from "@/types";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

type Draft = { title: string; assignee?: MemberId; dueOffset: number; priority: Priority; labels: string[] };

// AI-25 sentence → task, AI-12 meeting notes → action items. With the workspace AI
// switched on (Settings → AI, real mode) the text goes to Google Gemini; otherwise
// the built-in rule-based reader runs in the browser and nothing is sent anywhere.
// Every draft is shown for review; nothing is created until the person presses Create.
export default function AiCreate() {
  const { tasks, members, history, capacity, createTask, openDrawer, toast, spendAi, allowed, realMode, aiEnabled, geminiDrafts } = useStore();
  const canCreate = allowed("task.create");
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const useGemini = realMode && aiEnabled;
  const [quick, setQuick] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingOut, setMeetingOut] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [geminiOne, setGeminiOne] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const quickParsed = !useGemini && quick.trim() ? parseTaskText(quick, members) : null;

  // Gemini returns the assignee's user id; the signed-in user is "me" in the app
  const toDraft = (d: AiDraft): Draft => ({
    title: d.title,
    assignee: d.assigneeId ? (members[d.assigneeId] ? d.assigneeId : "me") : undefined,
    dueOffset: d.due_in_days ?? 7,
    priority: d.priority,
    labels: d.labels,
  });

  function create(d: Draft, labels: string[]) {
    const assignee = d.assignee ?? smartMatch({ id: "", title: d.title, description: "", labels: d.labels, module: undefined }, tasks, history, members, capacity).results[0]?.member ?? "me";
    return createTask({ projectId: project, title: d.title, priority: d.priority, dueOffset: d.dueOffset, labels: [...d.labels, ...labels], assignee });
  }

  function setDrafts(list: Draft[]) {
    setMeetingOut(list);
    setSelected(list.map((_, i) => i));
  }

  function createMeetingItems(indexes: number[]) {
    for (const i of indexes) {
      const a = meetingOut[i];
      createTask({ projectId: project, title: a.title, assignee: a.assignee ?? "me", dueOffset: a.dueOffset, priority: a.priority, labels: [...a.labels, "Meeting"] });
    }
    const left = meetingOut.filter((_, j) => !indexes.includes(j));
    setDrafts(left);
    toast(indexes.length === 1 ? tt("aiPage.taskCreated") : tt("aic.createdN", { n: indexes.length }));
  }

  const engineLine = (
    <p className="mute" style={{ margin: 0, fontSize: 12 }}>
      {useGemini ? tt("aiPage.engineGemini") : tt("aiPage.engineRules")}{" "}
      {realMode && !aiEnabled && (
        <Link className="link" href="/settings/ai">
          {tt("aiPage.turnOnAi")}
        </Link>
      )}
    </p>
  );
  const who = (d: Draft) => (d.assignee ? members[d.assignee]?.name ?? tt("aiPage.you") : tt("common.unassigned"));

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[0]} hint={useGemini ? tt("aiPage.hintGemini") : tt("aiPage.hint")} />
      <div className="ux-page">
        <FeatureHero
          id="aic-hero"
          icon={Wand2}
          title={tt("aic.heroTitle")}
          text={tt("aic.heroText")}
          status={useGemini ? "connected" : "available"}
          statusText={useGemini ? tt("aic.engineAi") : tt("aic.engineRules")}
          planId="AI-25"
        >
          <div className="ux-pills">{picker}</div>
        </FeatureHero>
        <HowItWorks
          id="aic-how"
          steps={[
            { title: tt("aic.s1"), text: tt("aic.s1t") },
            { title: tt("aic.s2"), text: tt("aic.s2t") },
            { title: tt("aic.s3"), text: tt("aic.s3t") },
          ]}
        />

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="aic-one">
            <SecHead id="aic-one" icon={Sparkles} title={tt("aiPage.sentence")} />
            <Gate id="AI-25">
              <div className="ux-form">
                <label>
                  {tt("aic.sentenceLabel")}
                  <input placeholder={tt("aiPage.sentencePlaceholder")} value={quick} onChange={(e) => setQuick(e.target.value)} />
                </label>
                {useGemini ? engineLine : <p className="mute" style={{ margin: 0, fontSize: 12 }}>{tt("aiPage.sentenceLang")}</p>}
                {useGemini && (
                  <div className="ux-actions">
                    <button
                      className="ghost"
                      disabled={busy || quick.trim().length < 3}
                      onClick={async () => {
                        setBusy(true);
                        const out = await geminiDrafts("sentence", quick);
                        setBusy(false);
                        setGeminiOne(out?.[0] ? toDraft(out[0]) : null);
                      }}
                    >
                      <Sparkles size={16} aria-hidden /> {busy ? tt("auth.wait") : tt("aiPage.readWithAi")}
                    </button>
                  </div>
                )}
                {quickParsed || geminiOne ? (
                  <div className="ux-result">
                    <div className="ux-pills">
                      <span className="ux-conf">{tt("ux.reviewFirst")}</span>
                    </div>
                    {quickParsed ? (
                      <>
                        <b>{quickParsed.title}</b>
                        <p className="mute" style={{ margin: 0, fontSize: 13 }}>
                          {tt("aiPage.parsed", {
                            date: dateForOffset(quickParsed.dueOffset),
                            priority: PRIORITY_LABEL[quickParsed.priority],
                            reason: quickParsed.priorityReason,
                            module: moduleName(quickParsed.module),
                            who: quickParsed.assignee ? members[quickParsed.assignee].name : tt("aiPage.you"),
                          })}
                        </p>
                      </>
                    ) : (
                      geminiOne && (
                        <>
                          <b>{geminiOne.title}</b>
                          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
                            {tt("aiPage.itemLine", { who: who(geminiOne), date: dateForOffset(geminiOne.dueOffset), priority: PRIORITY_LABEL[geminiOne.priority] })}
                          </p>
                        </>
                      )
                    )}
                    <div className="ux-actions">
                      <button
                        className="btn"
                        disabled={!canCreate || !ready}
                        onClick={async () => {
                          let id: string;
                          if (geminiOne) {
                            id = create(geminiOne, ["AI"]);
                            setGeminiOne(null);
                          } else {
                            if (!quickParsed || !(await spendAi())) return;
                            const q = quickParsed;
                            const assignee = q.assignee ?? smartMatch({ id: "", title: q.title, description: "", labels: q.labels, module: q.module }, tasks, history, members, capacity).results[0]?.member ?? "me";
                            id = createTask({ projectId: project, title: q.title, priority: q.priority, dueOffset: q.dueOffset, labels: q.labels, assignee, module: q.module });
                          }
                          setQuick("");
                          toast(tt("aiPage.taskCreated"));
                          openDrawer(id);
                        }}
                      >
                        <Plus size={16} aria-hidden /> {tt("common.create")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState compact icon={<Sparkles size={26} />} title={tt("aic.oneEmpty")} message={tt("aic.oneEmptyText")} />
                )}
              </div>
            </Gate>
          </section>

          <section className="card ux-sec" aria-labelledby="aic-meet">
            <SecHead id="aic-meet" icon={NotebookPen} title={tt("aiPage.meeting")} />
            <Gate id="AI-12">
              <div className="ux-form">
                <label>
                  {tt("aic.notesLabel")}
                  <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tt("aiPage.meetingPlaceholder")} />
                </label>
                {engineLine}
                <div className="ux-actions">
                  <button
                    className="ghost"
                    disabled={busy || notes.trim().length < 3}
                    onClick={async () => {
                      if (useGemini) {
                        setBusy(true);
                        const out = await geminiDrafts("meeting", notes);
                        setBusy(false);
                        if (out) setDrafts(out.map(toDraft));
                        if (out && !out.length) toast(tt("aiPage.noActions"));
                        return;
                      }
                      if (await spendAi()) {
                        const found = meetingToActions(notes, members).map((a) => ({ title: a.title, assignee: a.assignee ?? undefined, dueOffset: a.dueOffset, priority: a.priority, labels: [] }));
                        setDrafts(found);
                        if (!found.length) toast(tt("aiPage.noActions"));
                      }
                    }}
                  >
                    <ListTodo size={16} aria-hidden /> {busy ? tt("auth.wait") : tt("aiPage.extract")}
                  </button>
                </div>
              </div>
            </Gate>
          </section>
        </div>

        {meetingOut.length > 0 && (
          <section className="card ux-sec" aria-labelledby="aic-drafts">
            <SecHead id="aic-drafts" icon={ListTodo} title={tt("aic.draftsTitle")}>
              <span className="ux-conf">{tt("ux.reviewFirst")}</span>
            </SecHead>
            <div>
              {meetingOut.map((a, i) => (
                <div key={i} className="ux-result">
                  <label className="inline" style={{ alignItems: "flex-start", gap: 10 }}>
                    <input type="checkbox" checked={selected.includes(i)} onChange={() => setSelected((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))} />
                    <span>
                      <b>{a.title}</b>
                      <br />
                      <span className="mute" style={{ fontSize: 12 }}>
                        {tt("aiPage.itemLine", { who: who(a), date: dateForOffset(a.dueOffset), priority: PRIORITY_LABEL[a.priority] })}
                      </span>
                    </span>
                  </label>
                  <div className="ux-actions">
                    <button className="ghost sm" disabled={!canCreate || !ready} onClick={() => createMeetingItems([i])}>
                      <Plus size={14} aria-hidden /> {tt("common.create")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="ux-actions">
              <button className="ghost" onClick={() => setDrafts([])}>
                {tt("aic.discard")}
              </button>
              <button className="btn" disabled={!canCreate || !ready || !selected.length} onClick={() => createMeetingItems(selected)}>
                <Plus size={16} aria-hidden /> {tt("aic.createSelected", { n: selected.length })}
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
