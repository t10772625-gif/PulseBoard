"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { detectModule, moduleName, smartMatch } from "@/lib/ai";
import { STATUS_LABEL } from "@/lib/mock-data";
import { findByKey } from "@/lib/task-keys";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import { MemberId } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { useT } from "@/i18n/I18nProvider";

// DEV-01 commit → task link + status, DEV-02 PR reviewer (simulators — no GitHub App)
export default function IntegrationGithub() {
  const { tasks, taskPrefix, members, capacity, history, setTaskField, updateTask, toast, canEdit: canEditTasks, allowed } = useStore();
  const canEdit = canEditTasks && allowed("automation.manage");
  const { t: tt, rich } = useT();
  const [commit, setCommit] = useState("");
  const [prFiles, setPrFiles] = useState("");
  const [prAuthor, setPrAuthor] = useState<MemberId>("me");

  function runCommit() {
    // A task key in the message (PB-12) names the task; demo ids (t10) still work
    const keyRef = commit.match(/\b([A-Z][A-Z0-9]{1,5}-\d+)\b/)?.[1];
    const idRef = commit.match(/\b(t\d+)\b/i)?.[1];
    const t = keyRef ? findByKey(keyRef, tasks, taskPrefix) : idRef ? tasks.find((x) => x.id === idRef.toLowerCase()) : undefined;
    if (!t) return toast(tt("int.noKey"));
    const closes = /\b(fix(es|ed)?|close(s|d)?|resolve(s|d)?)\b/i.test(commit);
    if (closes && t.blockedBy && tasks.find((b) => b.id === t.blockedBy)?.status !== "done") return toast(tt("int.blocked", { title: t.title }));
    setTaskField(t.id, "status", closes ? "done" : "prog");
    updateTask(t.id, {}, tt("int.linkedCommit", { commit }));
    toast(tt("int.linked", { title: t.title, status: closes ? STATUS_LABEL.done : STATUS_LABEL.prog }));
  }

  // PR files → module → reviewer (never the author)
  const prModule = detectModule(prFiles.replace(/[/._]/g, " "));
  const reviewers = !prFiles.trim() ? [] : smartMatch({ id: "", title: prModule, description: "", labels: [], module: prModule }, tasks, history, members, capacity).results.filter((r) => r.member !== prAuthor);

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[3]} hint={tt("int.hint")} />
      <div className="grid g2">
        <div className="card">
          <h2>{tt("int.commitTitle")}</h2>
          <Gate id="DEV-01">
            <input dir="ltr" placeholder="Fix login crash, closes PB-12" value={commit} onChange={(e) => setCommit(e.target.value)} />
            <p className="mute" style={{ fontSize: 12, margin: "6px 0" }}>
              {tt("int.commitHint")}
            </p>
            <button className="ghost sm" disabled={!canEdit || !commit.trim()} onClick={runCommit}>
              {tt("int.simulatePush")}
            </button>
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("int.prTitle")}</h2>
          <Gate id="DEV-02">
            <label>
              {tt("int.changedFiles")}
              <textarea dir="ltr" rows={3} placeholder={"src/auth/login.ts\nsrc/auth/session.ts"} value={prFiles} onChange={(e) => setPrFiles(e.target.value)} />
            </label>
            <label style={{ marginTop: 8 }}>
              {tt("int.prAuthor")}
              <Dropdown value={prAuthor} onChange={setPrAuthor} options={(Object.keys(members) as MemberId[]).map((m) => ({ value: m, label: members[m].name }))} />
            </label>
            <p style={{ marginTop: 8 }}>{rich("int.suggestedReviewer", { module: moduleName(prModule), name: reviewers[0] ? members[reviewers[0].member].name : "—" })}</p>
            {reviewers[0] && (
              <p className="mute" style={{ fontSize: 12 }}>
                {tt("int.authorExcluded", { reason: reviewers[0].reason })}
              </p>
            )}
          </Gate>
        </div>
      </div>
    </>
  );
}
