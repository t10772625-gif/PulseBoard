"use client";
import { useState } from "react";
import { Info, MessagesSquare, Play, TerminalSquare } from "lucide-react";
import { isMine } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { parseTaskText } from "@/lib/ai";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/mock-data";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import { MemberId } from "@/types";
import Gate from "@/components/Gate";
import ChatWebhooks from "@/components/ChatWebhooks";
import SubPageHeader from "@/components/SubPageHeader";
import { FeatureHero, HowItWorks, SecHead } from "@/components/FeaturePage";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// SPEC-22: Slack slash commands, executed locally (simulator — no Slack connection)
export default function IntegrationSlack() {
  const { tasks, members, createTask, setTaskField, allowed, realMode } = useStore();
  const canEdit = allowed("task.create");
  const { t: tt } = useT();
  const { project, picker, ready } = useProjectPicker();
  const [slack, setSlack] = useState("");
  const [slackOut, setSlackOut] = useState<string[]>([]);

  function runSlack() {
    const cmd = slack.trim();
    const out: string[] = [];
    const task = (ref: string) => tasks.find((t) => t.id === ref.replace(/^#/, "") || t.title.toLowerCase().includes(ref.toLowerCase()));
    let m: RegExpMatchArray | null;
    if ((m = cmd.match(/^\/pulse\s+create\s+(.+)$/i))) {
      const p = parseTaskText(m[1].replace(/,/g, " "), members);
      const id = createTask({ projectId: project, title: p.title, priority: p.priority, assignee: p.assignee ?? "me", dueOffset: p.dueOffset, labels: p.labels });
      out.push(tt("int.created", { id, title: p.title, priority: PRIORITY_LABEL[p.priority], name: members[p.assignee ?? "me"].name }));
    } else if ((m = cmd.match(/^\/pulse\s+status\s+(.+)$/i))) {
      const t = task(m[1].trim());
      out.push(t ? tt("int.statusOut", { title: t.title, status: STATUS_LABEL[t.status as keyof typeof STATUS_LABEL] ?? t.status, name: members[t.assignee].name, n: t.dueOffset }) : tt("int.notFound"));
    } else if ((m = cmd.match(/^\/pulse\s+assign\s+(\S+)\s+to\s+(\w+)/i))) {
      const t = task(m[1]);
      const who = (Object.keys(members) as MemberId[]).find((k) => members[k].name.toLowerCase().startsWith(m![2].toLowerCase()));
      if (t && who) {
        setTaskField(t.id, "assignee", who);
        out.push(tt("int.assignedOut", { title: t.title, name: members[who].name }));
      } else out.push(tt("int.notFound2"));
    } else if (/^\/pulse\s+mytasks/i.test(cmd)) {
      tasks.filter((t) => isMine(t) && t.status !== "done").forEach((t) => out.push(`• ${t.id} ${t.title}`));
    } else if ((m = cmd.match(/^\/pulse\s+search\s+(.+)$/i))) {
      tasks.filter((t) => t.title.toLowerCase().includes(m![1].toLowerCase())).forEach((t) => out.push(`• ${t.id} ${t.title}`));
    } else out.push(tt("int.commands"));
    setSlackOut(out.length ? out : [tt("int.noResults")]);
  }

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[1]} hint={tt("sl.hint")} />
      <div className="ux-page">
        <FeatureHero
          id="sl-hero"
          icon={MessagesSquare}
          title={tt("sl.heroTitle")}
          text={tt("sl.heroText")}
          status={realMode ? "available" : "setup"}
          statusText={realMode ? tt("ux.st.available") : tt("ux.st.realOnly")}
          planId="INT-02"
        />
        <HowItWorks
          id="sl-how"
          steps={[
            { title: tt("sl.s1"), text: tt("sl.s1t") },
            { title: tt("sl.s2"), text: tt("sl.s2t") },
            { title: tt("sl.s3"), text: tt("sl.s3t") },
          ]}
        />
        <div className="grid g2">
          {realMode && (
            <Gate id="INT-02">
              <ChatWebhooks />
            </Gate>
          )}
          <section className="card ux-sec" aria-labelledby="sl-sim">
            <SecHead id="sl-sim" icon={TerminalSquare} title={tt("int.slackTitle")}>
              <span className="int-st">{tt("ux.st.simulator")}</span>
              {picker}
            </SecHead>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {tt("int.slackSimNote")}
            </p>
            <Gate id="INT-02">
              <div className="ux-inline">
                <label>
                  {tt("sl.cmdLabel")}
                  <input dir="ltr" placeholder="/pulse create bug: checkout timeout, high" value={slack} onChange={(e) => setSlack(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ready && canEdit && slack.trim() && runSlack()} />
                </label>
                <button className="btn" disabled={!canEdit || !ready || !slack.trim()} onClick={runSlack}>
                  <Play size={16} aria-hidden /> {tt("int.run")}
                </button>
              </div>
              {slackOut.length > 0 && (
                <pre className="doc-pre" dir="ltr" style={{ marginTop: 12 }}>
                  {slackOut.join("\n")}
                </pre>
              )}
              <p className="mute st-foot">
                <Info size={14} aria-hidden /> {tt("int.commands")}
              </p>
            </Gate>
          </section>
        </div>
      </div>
    </>
  );
}
