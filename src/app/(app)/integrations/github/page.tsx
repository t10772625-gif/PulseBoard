"use client";
import { useState } from "react";
import { GitBranch, GitCommitHorizontal, GitPullRequest, Info, Play } from "lucide-react";
import { useStore } from "@/lib/store";
import { detectModule, moduleName, smartMatch } from "@/lib/ai";
import { STATUS_LABEL } from "@/lib/mock-data";
import { findByKey } from "@/lib/task-keys";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import { MemberId } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { Avatar, EmptyState } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";

// DEV-01 commit → task link + status, DEV-02 PR reviewer (simulators — no GitHub App).
// A live GitHub webhook is deferred by the user until a separate security design review.
export default function IntegrationGithub() {
  const { tasks, taskPrefix, members, capacity, history, setTaskField, updateTask, toast, canEdit: canEditTasks } = useStore();
  const canEdit = canEditTasks;
  const { t: tt, rich } = useT();
  const [commit, setCommit] = useState("");
  const [prFiles, setPrFiles] = useState("");
  const [prAuthor, setPrAuthor] = useState<MemberId>("me");

  function runCommit() {
    // A task key in the message (PB-12) names the task; demo ids (t10) still work
    const keyRef = commit.match(/\b([A-Z][A-Z0-9]{1,5}-\d+)\b/)?.[1];
    const idRef = commit.match(/\b(t\d+)\b/i)?.[1];
    const t = keyRef ? findByKey(keyRef, tasks, taskPrefix) : idRef ? tasks.find((x) => x.id === idRef.toLowerCase()) : undefined;
    if (!t) return toast(tt("gh.noKey", { example: `${taskPrefix || "PB"}-12` }));
    const closes = /\b(fix(es|ed)?|close(s|d)?|resolve(s|d)?)\b/i.test(commit);
    if (closes && t.blockedBy && tasks.find((b) => b.id === t.blockedBy)?.status !== "done") return toast(tt("int.blocked", { title: t.title }));
    setTaskField(t.id, "status", closes ? "done" : "prog");
    updateTask(t.id, {}, tt("int.linkedCommit", { commit }));
    toast(tt("int.linked", { title: t.title, status: closes ? STATUS_LABEL.done : STATUS_LABEL.prog }));
  }

  // PR files → module → reviewer (never the author)
  const prModule = detectModule(prFiles.replace(/[/._]/g, " "));
  const reviewers = !prFiles.trim() ? [] : smartMatch({ id: "", title: prModule, description: "", labels: [], module: prModule }, tasks, history, members, capacity).results.filter((r) => r.member !== prAuthor);
  const example = `${taskPrefix || "PB"}-12`;

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[3]} hint={tt("gh.hint")} />
      <div className="ux-page">
        <FeatureHero id="gh-hero" icon={GitBranch} title={tt("gh.heroTitle")} text={tt("gh.heroText")} status="decision" statusText={tt("ux.st.deferred")} planId="DEV-01" />
        <HowItWorks
          id="gh-how"
          steps={[
            { title: tt("gh.s1"), text: tt("gh.s1t", { example }) },
            { title: tt("gh.s2"), text: tt("gh.s2t") },
            { title: tt("gh.s3"), text: tt("gh.s3t") },
          ]}
        />

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="gh-commit">
            <SecHead id="gh-commit" icon={GitCommitHorizontal} title={tt("int.commitTitle")}>
              <span className="int-st">{tt("ux.st.simulator")}</span>
            </SecHead>
            <Gate id="DEV-01">
              <div className="ux-form">
                <label>
                  {tt("gh.commitLabel")}
                  <input dir="ltr" placeholder={`Fix login crash, closes ${example}`} value={commit} onChange={(e) => setCommit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && canEdit && commit.trim() && runCommit()} />
                </label>
                <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                  {tt("gh.commitHint", { example })}
                </p>
              </div>
              <div className="ux-actions" style={{ marginTop: 12 }}>
                <button className="btn" disabled={!canEdit || !commit.trim()} onClick={runCommit}>
                  <Play size={16} aria-hidden /> {tt("int.simulatePush")}
                </button>
              </div>
            </Gate>
          </section>

          <section className="card ux-sec" aria-labelledby="gh-pr">
            <SecHead id="gh-pr" icon={GitPullRequest} title={tt("int.prTitle")}>
              <span className="int-st">{tt("ux.st.simulator")}</span>
            </SecHead>
            <Gate id="DEV-02">
              <div className="ux-form">
                <label>
                  {tt("int.changedFiles")}
                  <textarea dir="ltr" rows={3} placeholder={"src/auth/login.ts\nsrc/auth/session.ts"} value={prFiles} onChange={(e) => setPrFiles(e.target.value)} />
                </label>
                <label>
                  {tt("int.prAuthor")}
                  <Dropdown value={prAuthor} onChange={setPrAuthor} options={(Object.keys(members) as MemberId[]).map((m) => ({ value: m, label: members[m].name }))} />
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                {reviewers[0] ? (
                  <div className="ux-result">
                    <span className="ux-actor">
                      <Avatar id={reviewers[0].member} /> <span>{rich("int.suggestedReviewer", { module: moduleName(prModule), name: members[reviewers[0].member].name })}</span>
                    </span>
                    <p className="mute" style={{ margin: 0, fontSize: 12 }}>
                      {tt("int.authorExcluded", { reason: reviewers[0].reason })} · {tt("ux.ruleBased")}
                    </p>
                  </div>
                ) : (
                  <EmptyState compact icon={<GitPullRequest size={26} />} title={tt("gh.noReviewer")} message={tt("gh.noReviewerText")} />
                )}
              </div>
            </Gate>
          </section>
        </div>
        <p className="mute st-foot" style={{ marginTop: 0, borderTop: 0 }}>
          <Info size={14} aria-hidden /> {tt("gh.liveNote")}
        </p>
      </div>
    </>
  );
}
