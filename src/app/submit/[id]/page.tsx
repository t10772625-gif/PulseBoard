"use client";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { autoPriority, findDuplicates, smartMatch } from "@/lib/ai";
import { useT } from "@/i18n/I18nProvider";

// Public bug / feedback form (SPEC #26, CLI-08): duplicate check, auto-priority,
// module detection and auto-assignment happen before the task is created.
export default function SubmitBug() {
  const { id } = useParams<{ id: string }>();
  const { projects, tasks, members, capacity, history, createTask, addComment, branding } = useStore();
  const { t: tt, rich } = useT();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const project = projects[id];
  const dups = title.trim().length > 6 ? findDuplicates(title, tasks.filter((t) => t.projectId === id), undefined, 0.35) : [];

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return;
    const dup = dups[0];
    if (dup && dup.score >= 0.6) {
      addComment(dup.task.id, tt("submit.dupComment", { who: email || tt("submit.visitor"), text: details || title }));
      setDone(tt("submit.dupDone", { title: dup.task.title }));
      return;
    }
    const ap = autoPriority({ title, description: details, labels: ["Bug"], reports: dups.length });
    const who = smartMatch({ id: "", title, description: details, labels: ["Bug"], module: ap.module }, tasks, history, members, capacity).results[0]?.member ?? "me";
    const taskId = createTask({
      projectId: id,
      title: title.trim(),
      description: `${details}\n\n${tt("submit.descSuffix", { by: email ? tt("submit.by", { email }) : "" })}`,
      labels: ["Bug", tt("submit.clientFeedback")],
      priority: ap.priority,
      module: ap.module,
      assignee: who,
    });
    setDone(tt("submit.received", { id: taskId.slice(0, 8).toUpperCase() }));
  }

  return (
    <div className="page" style={{ maxWidth: 560, margin: "0 auto" }}>
      <span className="logo" style={{ marginBottom: 18, display: "flex" }}>
        <b style={branding.name !== "PulseBoard" ? { background: branding.color } : undefined}></b>
        {branding.name}
      </span>
      {!project ? (
        <div className="card">{tt("submit.noForm")}</div>
      ) : done ? (
        <div className="card">
          <h2>{tt("submit.receivedTitle")}</h2>
          <p>{done}</p>
          <button className="ghost" style={{ marginTop: 12 }} onClick={() => (setDone(null), setTitle(""), setDetails(""))}>
            {tt("submit.another")}
          </button>
        </div>
      ) : (
        <form className="card" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <h1>{tt("submit.title", { project: project.name })}</h1>
          <label>
            {tt("submit.what")}
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tt("submit.whatPlaceholder")} />
          </label>
          {dups.length > 0 && (
            <p className="mute" style={{ fontSize: 13 }}>
              {rich("submit.similar", { title: dups[0].task.title })}
            </p>
          )}
          <label>
            {tt("submit.details")}
            <textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
          </label>
          <label>
            {tt("submit.email")}
            <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button className="btn">{tt("submit.send")}</button>
          <p className="mute" style={{ fontSize: 11 }}>{tt("submit.demo")}</p>
        </form>
      )}
    </div>
  );
}
