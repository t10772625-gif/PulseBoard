"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PRIORITY_LABEL, dateForOffset } from "@/lib/mock-data";
import { meetingToActions, moduleName, parseTaskText, smartMatch } from "@/lib/ai";
import { AI_GROUP, AI_PAGES } from "@/lib/nav-groups";
import type { AiDraft } from "@/lib/integrations";
import { MemberId, Priority } from "@/types";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

type Draft = { title: string; assignee?: MemberId; dueOffset: number; priority: Priority; labels: string[] };

// AI-25 sentence → task, AI-12 meeting notes → action items. With the workspace AI
// switched on (Settings → AI, real mode) the text goes to Google Gemini; otherwise
// the built-in rule-based reader runs in the browser and nothing is sent anywhere.
export default function AiCreate() {
  const { tasks, members, history, capacity, createTask, openDrawer, toast, spendAi, canEdit, realMode, aiEnabled, geminiDrafts } = useStore();
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const useGemini = realMode && aiEnabled;
  const [quick, setQuick] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingOut, setMeetingOut] = useState<Draft[]>([]);
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

  const engine = (
    <p className="mute" style={{ fontSize: 12, marginTop: 4 }}>
      {useGemini ? tt("aiPage.engineGemini") : tt("aiPage.engineRules")}{" "}
      {realMode && !aiEnabled && (
        <Link className="link" href="/settings/ai">
          {tt("aiPage.turnOnAi")}
        </Link>
      )}
    </p>
  );

  return (
    <>
      <SubPageHeader group={AI_GROUP} page={AI_PAGES[0]} hint={useGemini ? tt("aiPage.hintGemini") : tt("aiPage.hint")} actions={picker} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("aiPage.sentence")}</h2>
          <Gate id="AI-25">
            <input placeholder={tt("aiPage.sentencePlaceholder")} value={quick} onChange={(e) => setQuick(e.target.value)} />
            {useGemini ? engine : <p className="mute" style={{ fontSize: 12, marginTop: 4 }}>{tt("aiPage.sentenceLang")}</p>}
            {useGemini && (
              <button
                className="ghost sm"
                style={{ marginTop: 8 }}
                disabled={busy || quick.trim().length < 3}
                onClick={async () => {
                  setBusy(true);
                  const out = await geminiDrafts("sentence", quick);
                  setBusy(false);
                  setGeminiOne(out?.[0] ? toDraft(out[0]) : null);
                }}
              >
                {busy ? tt("auth.wait") : tt("aiPage.readWithAi")}
              </button>
            )}
            {(quickParsed || geminiOne) && (
              <div className="ai-out">
                {quickParsed ? (
                  <>
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
                  </>
                ) : (
                  geminiOne && (
                    <>
                      <p>
                        <b>{geminiOne.title}</b>
                      </p>
                      <p className="mute" style={{ fontSize: 13 }}>
                        {tt("aiPage.itemLine", { who: geminiOne.assignee ? members[geminiOne.assignee]?.name ?? tt("aiPage.you") : tt("common.unassigned"), date: dateForOffset(geminiOne.dueOffset), priority: PRIORITY_LABEL[geminiOne.priority] })}
                      </p>
                    </>
                  )
                )}
                <button
                  className="btn sm"
                  disabled={!canEdit || !ready}
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
                  {tt("common.create")}
                </button>
              </div>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("aiPage.meeting")}</h2>
          <Gate id="AI-12">
            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tt("aiPage.meetingPlaceholder")} />
            {engine}
            <button
              className="ghost sm"
              style={{ marginTop: 8 }}
              disabled={busy || notes.trim().length < 3}
              onClick={async () => {
                if (useGemini) {
                  setBusy(true);
                  const out = await geminiDrafts("meeting", notes);
                  setBusy(false);
                  if (out) setMeetingOut(out.map(toDraft));
                  if (out && !out.length) toast(tt("aiPage.noActions"));
                  return;
                }
                if (await spendAi()) setMeetingOut(meetingToActions(notes, members).map((a) => ({ title: a.title, assignee: a.assignee ?? undefined, dueOffset: a.dueOffset, priority: a.priority, labels: [] })));
              }}
            >
              {busy ? tt("auth.wait") : tt("aiPage.extract")}
            </button>
            {meetingOut.length > 0 && (
              <div className="ai-out">
                {meetingOut.map((a, i) => (
                  <div key={i} className="sugg">
                    <span>
                      <b>{a.title}</b>
                      <br />
                      <span className="mute" style={{ fontSize: 12 }}>
                        {tt("aiPage.itemLine", { who: a.assignee ? members[a.assignee]?.name ?? tt("aiPage.you") : tt("common.unassigned"), date: dateForOffset(a.dueOffset), priority: PRIORITY_LABEL[a.priority] })}
                      </span>
                    </span>
                    <button
                      className="btn sm"
                      disabled={!canEdit || !ready}
                      onClick={() => {
                        createTask({ projectId: project, title: a.title, assignee: a.assignee ?? "me", dueOffset: a.dueOffset, priority: a.priority, labels: [...a.labels, "Meeting"] });
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
      </div>
    </>
  );
}
