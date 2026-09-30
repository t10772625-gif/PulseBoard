"use client";
import { FormEvent, useState } from "react";
import { useStore, health } from "@/lib/store";
import { dateForOffset } from "@/lib/mock-data";
import { Client, ProjectId } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { EmptyState } from "@/components/ui";
import { download } from "@/lib/csv";

export default function Clients() {
  const { clients, addClient, updateClient, projects, tasks, branding, createShareLink, toast, openDrawer, updateTask, can, allowed } = useStore();
  const canEdit = allowed("client.manage");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState<ProjectId>(Object.keys(projects)[0]);
  const [report, setReport] = useState<Client | null>(null);

  const billedHours = (c: Client) => tasks.filter((t) => t.projectId === c.projectId && t.billable).reduce((s, t) => s + t.trackedSeconds, 0) / 3600;
  const pending = tasks.filter((t) => t.approval === "requested");

  // One-click onboarding (CLI-02): client record + portal link + weekly report in one step
  function onboard(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return toast("Enter a client name and a valid email");
    addClient({ name: name.trim(), email: email.trim(), projectId, hourlyRate: 40, budget: 2000, reportDay: "Fri" });
    const token = createShareLink("board", projectId);
    navigator.clipboard?.writeText(`${window.location.origin}/share/${token}`);
    toast(`${name} onboarded: portal link copied, Friday report scheduled`);
    setName("");
    setEmail("");
  }

  function portal(c: Client) {
    const token = createShareLink("board", c.projectId);
    navigator.clipboard?.writeText(`${window.location.origin}/share/${token}`);
    toast("Client portal link copied");
  }

  function reportText(c: Client) {
    const ts = tasks.filter((t) => t.projectId === c.projectId);
    const h = health(c.projectId, tasks);
    return [
      `${branding.name} — ${projects[c.projectId].name} progress report`,
      `For ${c.name} · ${dateForOffset(-6)}–${dateForOffset(0)}`,
      "",
      `Health: ${h.score} (${h.label})`,
      `✅ Done: ${ts.filter((t) => t.status === "done").length}`,
      `🔄 In progress: ${ts.filter((t) => t.status === "prog" || t.status === "rev").length}`,
      `⏳ To do: ${ts.filter((t) => t.status === "todo").length}`,
      `⏱ Billable hours: ${billedHours(c).toFixed(1)}h (${(billedHours(c) * c.hourlyRate).toFixed(0)} of ${c.budget} budget)`,
      "",
      "Recently completed:",
      ...ts.filter((t) => t.status === "done").slice(0, 5).map((t) => `- ${t.title}`),
    ].join("\n");
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Clients</h1>
          <p className="mute">Client portals, approvals, budgets and reports.</p>
        </div>
      </div>

      <Gate id="CLI-01">
        <div className="grid g2" style={{ marginBottom: 18 }}>
          <div className="card">
            <h2>Onboard a client</h2>
            <Gate id="CLI-02">
              <form onSubmit={onboard} style={{ display: "grid", gap: 10 }}>
                <div className="f2">
                  <label>
                    Name
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client company" />
                  </label>
                  <label>
                    Email
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
                  </label>
                </div>
                <label>
                  Project
                  <Dropdown value={projectId} onChange={setProjectId} options={Object.keys(projects).map((p) => ({ value: p, label: projects[p].name }))} />
                </label>
                <button className="btn" disabled={!canEdit}>
                  Onboard in one click
                </button>
                <p className="mute" style={{ fontSize: 12 }}>Creates the client, copies a read-only portal link, and schedules a Friday report. Emails aren&apos;t actually sent (no mail service connected).</p>
              </form>
            </Gate>
          </div>
          <div className="card">
            <h2>Waiting for client approval</h2>
            <Gate id="CLI-03">
              {pending.length ? (
                pending.map((t) => (
                  <div key={t.id} className="sugg">
                    <button className="link" onClick={() => openDrawer(t.id)}>
                      {t.title}
                    </button>
                    <span className="pill-row">
                      <button className="btn sm" onClick={() => updateTask(t.id, { approval: "approved" }, "Client approved this")}>
                        Approve (as client)
                      </button>
                      <button className="ghost sm" onClick={() => updateTask(t.id, { approval: "rejected" }, "Client requested changes")}>
                        Request changes
                      </button>
                    </span>
                  </div>
                ))
              ) : (
                <p className="mute">No pending approvals. Use &quot;Request client approval&quot; on a task.</p>
              )}
            </Gate>
          </div>
        </div>

        <h2>All clients</h2>
        <Gate id="CLI-07">
          <div className="grid g2" style={{ marginBottom: 18 }}>
            {clients.length === 0 && <EmptyState title="No clients yet" message="Clients you add will show their budgets, hours and reports here." />}
            {clients.map((c) => {
              const hours = billedHours(c);
              const spent = hours * c.hourlyRate;
              const pct = Math.round((spent / Math.max(1, c.budget)) * 100);
              const h = health(c.projectId, tasks);
              return (
                <div key={c.id} className="card">
                  <div className="meta">
                    <b>{c.name}</b>
                    <span className="chip" style={{ color: h.color }}>
                      {projects[c.projectId]?.name} · {h.score}
                    </span>
                  </div>
                  <p className="mute" style={{ fontSize: 13, margin: "6px 0" }}>
                    {c.email}
                  </p>
                  <Gate id="CLI-05">
                    <div className="wl-row">
                      <span style={{ fontSize: 13, width: 70 }}>Budget</span>
                      <div className="wl-bar">
                        <i style={{ width: `${Math.min(100, pct)}%`, background: pct >= 100 ? "var(--bad)" : pct >= 80 ? "var(--warn)" : "var(--acc)" }} />
                      </div>
                      <b>{pct}%</b>
                    </div>
                    <p className="mute" style={{ fontSize: 12 }}>
                      {hours.toFixed(1)} billable h × {c.hourlyRate}/h = {spent.toFixed(0)} of {c.budget}
                      {pct >= 80 && <b style={{ color: "var(--bad)" }}> · ⚠️ {pct >= 100 ? "over budget" : "80% used"}</b>}
                    </p>
                  </Gate>
                  <div className="f2" style={{ margin: "10px 0" }}>
                    <label>
                      Rate / h
                      <input type="number" min={0} value={c.hourlyRate} disabled={!can("CLI-04") || !canEdit} onChange={(e) => updateClient(c.id, { hourlyRate: Number(e.target.value) })} />
                    </label>
                    <label>
                      Budget
                      <input type="number" min={0} value={c.budget} disabled={!can("CLI-05") || !canEdit} onChange={(e) => updateClient(c.id, { budget: Number(e.target.value) })} />
                    </label>
                    <label>
                      Auto report
                      <Dropdown<Client["reportDay"]>
                        value={c.reportDay}
                        disabled={!can("NOTIF-06") || !canEdit}
                        onChange={(v) => updateClient(c.id, { reportDay: v })}
                        options={[
                          { value: "Fri", label: "Every Friday" },
                          { value: "Mon", label: "Every Monday" },
                          { value: "none", label: "Off" },
                        ]}
                      />
                    </label>
                  </div>
                  <div className="pill-row">
                    <button className="ghost sm" onClick={() => portal(c)} disabled={!can("SPEC-25")}>
                      Copy portal link {!can("SPEC-25") && "🔒"}
                    </button>
                    <button className="ghost sm" onClick={() => setReport(c)} disabled={!can("NOTIF-06")}>
                      Preview report
                    </button>
                    <button
                      className="ghost sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/submit/${c.projectId}`);
                        toast("Feedback form link copied");
                      }}
                      disabled={!can("CLI-08")}
                    >
                      Feedback form link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Gate>

        {report && (
          <div className="card" style={{ borderTop: `4px solid ${branding.color}` }}>
            <div className="meta">
              <h2 style={{ margin: 0 }}>Report preview: {report.name}</h2>
              <button className="ic" aria-label="Close preview" onClick={() => setReport(null)}>
                ✕
              </button>
            </div>
            <Gate id="CLI-06" compact>
              {null}
            </Gate>
            <pre className="doc-pre" style={{ marginTop: 10 }}>
              {reportText(report)}
            </pre>
            <div className="pill-row">
              <button className="ghost sm" onClick={() => download(`${report.name}-report.txt`, reportText(report), "text/plain")}>
                Download
              </button>
              <button className="ghost sm" onClick={() => window.print()} disabled={!can("CLI-06")}>
                Print / save as PDF (branded)
              </button>
            </div>
          </div>
        )}
      </Gate>
    </>
  );
}
