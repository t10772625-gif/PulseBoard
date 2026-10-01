"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/mock-data";
import { detectModule, moduleName, parseTaskText, smartMatch } from "@/lib/ai";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/mock-data";
import { download } from "@/lib/csv";
import { MemberId, ProjectId } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate, { PlanTag } from "@/components/Gate";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

const CATALOG: { key: string; name: string; desc: MessageKey; feature: string; note?: MessageKey }[] = [
  { key: "github", name: "GitHub", desc: "int.githubDesc", feature: "DEV-01" },
  { key: "slack", name: "Slack", desc: "int.slackDesc", feature: "INT-02" },
  { key: "gcal", name: "Google Calendar", desc: "int.gcalDesc", feature: "INT-02" },
  { key: "gmail", name: "Gmail", desc: "int.gmailDesc", feature: "INT-01", note: "int.gmailNote" },
  { key: "drive", name: "Google Drive", desc: "int.driveDesc", feature: "INT-02" },
  { key: "discord", name: "Discord", desc: "int.discordDesc", feature: "INT-02" },
  { key: "telegram", name: "Telegram", desc: "int.telegramDesc", feature: "INT-02" },
  { key: "zapier", name: "Zapier / Make / IFTTT", desc: "int.zapierDesc", feature: "INT-02" },
  { key: "whatsapp", name: "WhatsApp Business", desc: "int.whatsappDesc", feature: "INT-02-PAID", note: "int.whatsappNote" },
];

export default function Integrations() {
  const { integrations, toggleIntegration, tasks, projects, members, capacity, history, createTask, setTaskField, updateTask, currentProjectId, toast, openDrawer, can, canEdit: canEditTasks, allowed } = useStore();
  const canEdit = canEditTasks && allowed("automation.manage");
  const { t: tt, rich } = useT();
  const [project, setProject] = useState<ProjectId>(currentProjectId);
  const [slack, setSlack] = useState("/pulse create bug: checkout timeout, high, Bilal");
  const [slackOut, setSlackOut] = useState<string[]>([]);
  const [commit, setCommit] = useState("Fix login crash on Android, closes t10");
  const [prFiles, setPrFiles] = useState("src/auth/biometric.ts\nsrc/auth/login.ts");
  const [prAuthor, setPrAuthor] = useState<MemberId>("ba");
  const [email, setEmail] = useState("From: hr@company.com\nSubject: Shortlist candidate Ali Khan\n\nPlease shortlist Ali Khan and send him for interview by Friday. Urgent.");

  // SPEC-22: Slack slash commands, executed locally
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

  // DEV-01: commit message → link + auto status
  function runCommit() {
    const ref = commit.match(/\b(t\d+)\b/i)?.[1];
    const t = ref ? tasks.find((x) => x.id === ref.toLowerCase()) : undefined;
    if (!t) return toast(tt("int.noKey"));
    const closes = /\b(fix(es|ed)?|close(s|d)?|resolve(s|d)?)\b/i.test(commit);
    if (closes && t.blockedBy && tasks.find((b) => b.id === t.blockedBy)?.status !== "done") return toast(tt("int.blocked", { title: t.title }));
    setTaskField(t.id, "status", closes ? "done" : "prog");
    updateTask(t.id, {}, tt("int.linkedCommit", { commit }));
    toast(tt("int.linked", { title: t.title, status: closes ? STATUS_LABEL.done : STATUS_LABEL.prog }));
  }

  // DEV-02: PR files → module → reviewer (never the author)
  const prModule = detectModule(prFiles.replace(/[/._]/g, " "));
  const reviewers = smartMatch({ id: "", title: prModule, description: "", labels: [], module: prModule }, tasks, history, members, capacity).results.filter((r) => r.member !== prAuthor);

  // INT-01: email → task
  const subject = email.match(/^subject:\s*(.+)$/im)?.[1] ?? "";
  const body = email.split(/\n\s*\n/).slice(1).join(" ");
  const emailTask = parseTaskText(`${subject}. ${body}`.replace(/\s+/g, " "), members);

  function exportIcs() {
    const stamp = (off: number) => {
      const d = new Date(TODAY);
      d.setDate(d.getDate() + off);
      return d.toISOString().slice(0, 10).replace(/-/g, "");
    };
    const events = tasks
      .filter((t) => t.status !== "done")
      .map((t) => ["BEGIN:VEVENT", `UID:${t.id}@pulseboard`, `DTSTART;VALUE=DATE:${stamp(t.dueOffset)}`, `SUMMARY:${t.title.replace(/[,;]/g, " ")}`, `DESCRIPTION:${projects[t.projectId].name}`, "END:VEVENT"].join("\r\n"));
    download("pulseboard-due-dates.ics", ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PulseBoard//EN", ...events, "END:VCALENDAR"].join("\r\n"), "text/calendar");
    toast(tt("int.exportedIcs", { n: events.length }));
  }

  function importTrello(file: File) {
    file.text().then((txt) => {
      try {
        const data = JSON.parse(txt) as { lists?: { id: string; name: string; closed?: boolean }[]; cards?: { name: string; desc?: string; idList: string; closed?: boolean; labels?: { name: string }[] }[] };
        const lists = Object.fromEntries((data.lists ?? []).map((l) => [l.id, l.name.toLowerCase()]));
        let n = 0;
        for (const c of data.cards ?? []) {
          if (c.closed) continue;
          const list = lists[c.idList] ?? "";
          createTask({
            projectId: project,
            title: c.name,
            description: c.desc ?? "",
            status: /done|complete/.test(list) ? "done" : /doing|progress/.test(list) ? "prog" : "todo",
            labels: (c.labels ?? []).map((l) => l.name).filter(Boolean).concat("Trello"),
          });
          n++;
        }
        toast(tt("int.importedTrello", { n }));
      } catch {
        toast(tt("int.notTrello"));
      }
    });
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("int.title")}</h1>
          <p className="mute">{tt("int.hint")}</p>
        </div>
        <Dropdown value={project} onChange={setProject} options={Object.keys(projects).map((p) => ({ value: p, label: projects[p].name }))} />
      </div>

      <div className="grid g3" style={{ marginBottom: 18 }}>
        {CATALOG.map((c) => (
          <div key={c.key} className="card">
            <div className="meta">
              <b>
                {c.name}
                <PlanTag id={c.feature} />
              </b>
              <button className={integrations[c.key] ? "btn sm" : "ghost sm"} disabled={!can(c.feature) || !canEdit} onClick={() => toggleIntegration(c.key)}>
                {!can(c.feature) ? "🔒" : integrations[c.key] ? tt("int.connectedDemo") : tt("int.connect")}
              </button>
            </div>
            <p className="mute" style={{ fontSize: 13, marginTop: 6 }}>
              {tt(c.desc)}
            </p>
            {c.note && (
              <p className="mute" style={{ fontSize: 11, marginTop: 4 }}>
                ⚠️ {tt(c.note)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid g2">
        <div className="card">
          <h2>{tt("int.slackTitle")}</h2>
          <Gate id="INT-02">
            <input dir="ltr" value={slack} onChange={(e) => setSlack(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSlack()} />
            <button className="ghost sm" style={{ marginTop: 8 }} disabled={!canEdit} onClick={runSlack}>
              {tt("int.run")}
            </button>
            {slackOut.length > 0 && <pre className="doc-pre" style={{ marginTop: 8 }}>{slackOut.join("\n")}</pre>}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("int.emailTitle")}</h2>
          <Gate id="INT-01">
            <textarea rows={5} value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="mute" style={{ fontSize: 13, margin: "8px 0" }}>
              → <b>{emailTask.title || tt("int.noTitle")}</b> · {PRIORITY_LABEL[emailTask.priority]} · {tt("int.dueIn", { n: emailTask.dueOffset })}
            </p>
            <button
              className="btn sm"
              disabled={!emailTask.title || !canEdit}
              onClick={() => {
                const id = createTask({ projectId: project, title: emailTask.title, priority: emailTask.priority, dueOffset: emailTask.dueOffset, description: body, labels: ["Email"] });
                toast(tt("int.taskFromEmail"));
                openDrawer(id);
              }}
            >
              {tt("int.createTask")}
            </button>
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("int.commitTitle")}</h2>
          <Gate id="DEV-01">
            <input dir="ltr" value={commit} onChange={(e) => setCommit(e.target.value)} />
            <p className="mute" style={{ fontSize: 12, margin: "6px 0" }}>
              {tt("int.commitHint")}
            </p>
            <button className="ghost sm" disabled={!canEdit} onClick={runCommit}>
              {tt("int.simulatePush")}
            </button>
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("int.prTitle")}</h2>
          <Gate id="DEV-02">
            <label>
              {tt("int.changedFiles")}
              <textarea dir="ltr" rows={3} value={prFiles} onChange={(e) => setPrFiles(e.target.value)} />
            </label>
            <label style={{ marginTop: 8 }}>
              {tt("int.prAuthor")}
              <Dropdown value={prAuthor} onChange={setPrAuthor} options={(Object.keys(members) as MemberId[]).map((m) => ({ value: m, label: members[m].name }))} />
            </label>
            <p style={{ marginTop: 8 }}>
              {rich("int.suggestedReviewer", { module: moduleName(prModule), name: reviewers[0] ? members[reviewers[0].member].name : "—" })}
            </p>
            {reviewers[0] && (
              <p className="mute" style={{ fontSize: 12 }}>
                {tt("int.authorExcluded", { reason: reviewers[0].reason })}
              </p>
            )}
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("int.calendarTitle")}</h2>
          <Gate id="INT-02">
            <p className="mute" style={{ fontSize: 13, marginBottom: 8 }}>
              {tt("int.calendarHint")}
            </p>
            <button className="ghost sm" onClick={exportIcs}>
              {tt("int.exportIcs")}
            </button>
          </Gate>
        </div>

        <div className="card">
          <h2>{tt("int.importTitle")}</h2>
          <Gate id="INT-02">
            <label className="ghost sm" style={{ cursor: "pointer", display: "inline-block" }}>
              {tt("int.trello")}
              <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && importTrello(e.target.files[0])} />
            </label>
            <p className="mute" style={{ fontSize: 12, marginTop: 8 }}>
              {tt("int.otherTools")}
            </p>
          </Gate>
        </div>
      </div>
    </>
  );
}
