"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { parseTaskText } from "@/lib/ai";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/mock-data";
import { INTEGRATION_GROUP, INTEGRATION_PAGES } from "@/lib/nav-groups";
import { MemberId } from "@/types";
import Gate from "@/components/Gate";
import ChatWebhooks from "@/components/ChatWebhooks";
import SubPageHeader from "@/components/SubPageHeader";
import { useProjectPicker } from "@/components/ProjectPicker";
import { useT } from "@/i18n/I18nProvider";

// SPEC-22: Slack slash commands, executed locally (simulator — no Slack connection)
export default function IntegrationSlack() {
  const { tasks, members, createTask, setTaskField, canEdit: canEditTasks, allowed, realMode } = useStore();
  const canEdit = canEditTasks && allowed("automation.manage");
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
      tasks.filter((t) => t.assignee === "me" && t.status !== "done").forEach((t) => out.push(`• ${t.id} ${t.title}`));
    } else if ((m = cmd.match(/^\/pulse\s+search\s+(.+)$/i))) {
      tasks.filter((t) => t.title.toLowerCase().includes(m![1].toLowerCase())).forEach((t) => out.push(`• ${t.id} ${t.title}`));
    } else out.push(tt("int.commands"));
    setSlackOut(out.length ? out : [tt("int.noResults")]);
  }

  return (
    <>
      <SubPageHeader group={INTEGRATION_GROUP} page={INTEGRATION_PAGES[1]} hint={tt("int.hint")} actions={picker} />
      <div className="grid g2">
        {realMode && (
          <Gate id="INT-02">
            <ChatWebhooks />
          </Gate>
        )}
        <div className="card">
          <h2>{tt("int.slackTitle")}</h2>
          <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
            {tt("int.slackSimNote")}
          </p>
          <Gate id="INT-02">
            <input dir="ltr" placeholder="/pulse create bug: checkout timeout, high" value={slack} onChange={(e) => setSlack(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ready && runSlack()} />
            <button className="ghost sm" style={{ marginTop: 8 }} disabled={!canEdit || !ready || !slack.trim()} onClick={runSlack}>
              {tt("int.run")}
            </button>
            {slackOut.length > 0 && <pre className="doc-pre" style={{ marginTop: 8 }}>{slackOut.join("\n")}</pre>}
          </Gate>
        </div>
      </div>
    </>
  );
}
