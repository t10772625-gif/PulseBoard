"use client";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { autoPriority, findDuplicates, smartMatch } from "@/lib/ai";

// Public bug / feedback form (SPEC #26, CLI-08): duplicate check, auto-priority,
// module detection and auto-assignment happen before the task is created.
export default function SubmitBug() {
  const { id } = useParams<{ id: string }>();
  const { projects, tasks, members, capacity, history, createTask, addComment, branding } = useStore();
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
      addComment(dup.task.id, `Another report from ${email || "a visitor"}: ${details || title}`);
      setDone(`Thanks! This looks like an issue we're already tracking ("${dup.task.title}"), so we added your report to it.`);
      return;
    }
    const ap = autoPriority({ title, description: details, labels: ["Bug"], reports: dups.length });
    const who = smartMatch({ id: "", title, description: details, labels: ["Bug"], module: ap.module }, tasks, history, members, capacity).results[0]?.member ?? "me";
    const taskId = createTask({
      projectId: id,
      title: title.trim(),
      description: `${details}\n\nReported via public form${email ? ` by ${email}` : ""}.`,
      labels: ["Bug", "Client Feedback"],
      priority: ap.priority,
      module: ap.module,
      assignee: who,
    });
    setDone(`Thanks! Your report ${taskId.slice(0, 8).toUpperCase()} has been received.`);
  }

  return (
    <div className="page" style={{ maxWidth: 560, margin: "0 auto" }}>
      <span className="logo" style={{ marginBottom: 18, display: "flex" }}>
        <b style={branding.name !== "PulseBoard" ? { background: branding.color } : undefined}></b>
        {branding.name}
      </span>
      {!project ? (
        <div className="card">This form doesn&apos;t exist.</div>
      ) : done ? (
        <div className="card">
          <h2>Report received</h2>
          <p>{done}</p>
          <button className="ghost" style={{ marginTop: 12 }} onClick={() => (setDone(null), setTitle(""), setDetails(""))}>
            Report another issue
          </button>
        </div>
      ) : (
        <form className="card" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <h1>Report a problem: {project.name}</h1>
          <label>
            What went wrong?
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Payment page times out" />
          </label>
          {dups.length > 0 && (
            <p className="mute" style={{ fontSize: 13 }}>
              Similar known issue: <b>{dups[0].task.title}</b> — we&apos;ll add your report to it if it&apos;s the same.
            </p>
          )}
          <label>
            Details (steps, device, what you expected)
            <textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
          </label>
          <label>
            Email (optional, for updates)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button className="btn">Send report</button>
          <p className="mute" style={{ fontSize: 11 }}>Demo: without a backend this form only works in the browser session that has the workspace open.</p>
        </form>
      )}
    </div>
  );
}
