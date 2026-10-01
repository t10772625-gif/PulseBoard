"use client";
import { FormEvent, useState } from "react";
import { useStore, health } from "@/lib/store";
import { dateForOffset } from "@/lib/mock-data";
import { Client, ProjectId } from "@/types";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { EmptyState } from "@/components/ui";
import { download } from "@/lib/csv";
import { useT } from "@/i18n/I18nProvider";

export default function Clients() {
  const { clients, addClient, updateClient, projects, tasks, branding, createShareLink, toast, openDrawer, updateTask, can, allowed } = useStore();
  const canEdit = allowed("client.manage");
  const { t: tt, fmt } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState<ProjectId>(Object.keys(projects)[0]);
  const [report, setReport] = useState<Client | null>(null);

  const billedHours = (c: Client) => tasks.filter((t) => t.projectId === c.projectId && t.billable).reduce((s, t) => s + t.trackedSeconds, 0) / 3600;
  const pending = tasks.filter((t) => t.approval === "requested");

  // One-click onboarding (CLI-02): client record + portal link + weekly report in one step
  function onboard(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return toast(tt("clients.enterValid"));
    addClient({ name: name.trim(), email: email.trim(), projectId, hourlyRate: 40, budget: 2000, reportDay: "Fri" });
    const token = createShareLink("board", projectId);
    navigator.clipboard?.writeText(`${window.location.origin}/share/${token}`);
    toast(tt("clients.onboarded", { name }));
    setName("");
    setEmail("");
  }

  function portal(c: Client) {
    const token = createShareLink("board", c.projectId);
    navigator.clipboard?.writeText(`${window.location.origin}/share/${token}`);
    toast(tt("clients.portalCopied"));
  }

  function reportText(c: Client) {
    const ts = tasks.filter((t) => t.projectId === c.projectId);
    const h = health(c.projectId, tasks);
    return [
      tt("clients.rTitle", { brand: branding.name, project: projects[c.projectId].name }),
      tt("clients.rFor", { client: c.name, from: dateForOffset(-6), to: dateForOffset(0) }),
      "",
      tt("clients.rHealth", { score: h.score, label: h.label }),
      tt("clients.rDone", { n: ts.filter((t) => t.status === "done").length }),
      tt("clients.rProgress", { n: ts.filter((t) => t.status === "prog" || t.status === "rev").length }),
      tt("clients.rTodo", { n: ts.filter((t) => t.status === "todo").length }),
      tt("clients.rBillable", { hours: fmt.number(billedHours(c), { maximumFractionDigits: 1 }), spent: fmt.number(Math.round(billedHours(c) * c.hourlyRate)), budget: fmt.number(c.budget) }),
      "",
      tt("clients.rRecent"),
      ...ts.filter((t) => t.status === "done").slice(0, 5).map((t) => `- ${t.title}`),
    ].join("\n");
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("clients.title")}</h1>
          <p className="mute">{tt("clients.hint")}</p>
        </div>
      </div>

      <Gate id="CLI-01">
        <div className="grid g2" style={{ marginBottom: 18 }}>
          <div className="card">
            <h2>{tt("clients.onboardTitle")}</h2>
            <Gate id="CLI-02">
              <form onSubmit={onboard} style={{ display: "grid", gap: 10 }}>
                <div className="f2">
                  <label>
                    {tt("common.name")}
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tt("clients.companyPlaceholder")} />
                  </label>
                  <label>
                    {tt("common.email")}
                    <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
                  </label>
                </div>
                <label>
                  {tt("common.project")}
                  <Dropdown value={projectId} onChange={setProjectId} options={Object.keys(projects).map((p) => ({ value: p, label: projects[p].name }))} />
                </label>
                <button className="btn" disabled={!canEdit}>
                  {tt("clients.onboardBtn")}
                </button>
                <p className="mute" style={{ fontSize: 12 }}>{tt("clients.onboardNote")}</p>
              </form>
            </Gate>
          </div>
          <div className="card">
            <h2>{tt("clients.waiting")}</h2>
            <Gate id="CLI-03">
              {pending.length ? (
                pending.map((t) => (
                  <div key={t.id} className="sugg">
                    <button className="link" onClick={() => openDrawer(t.id)}>
                      {t.title}
                    </button>
                    <span className="pill-row">
                      <button className="btn sm" onClick={() => updateTask(t.id, { approval: "approved" }, tt("clients.actApproved"))}>
                        {tt("clients.approve")}
                      </button>
                      <button className="ghost sm" onClick={() => updateTask(t.id, { approval: "rejected" }, tt("clients.actChanges"))}>
                        {tt("clients.requestChanges")}
                      </button>
                    </span>
                  </div>
                ))
              ) : (
                <p className="mute">{tt("clients.noPending")}</p>
              )}
            </Gate>
          </div>
        </div>

        <h2>{tt("clients.all")}</h2>
        <Gate id="CLI-07">
          <div className="grid g2" style={{ marginBottom: 18 }}>
            {clients.length === 0 && <EmptyState title={tt("clients.empty")} message={tt("clients.emptyMsg")} />}
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
                  <p className="mute" style={{ fontSize: 13, margin: "6px 0" }} dir="ltr">
                    {c.email}
                  </p>
                  <Gate id="CLI-05">
                    <div className="wl-row">
                      <span style={{ fontSize: 13, width: 70 }}>{tt("clients.budget")}</span>
                      <div className="wl-bar">
                        <i style={{ width: `${Math.min(100, pct)}%`, background: pct >= 100 ? "var(--bad)" : pct >= 80 ? "var(--warn)" : "var(--acc)" }} />
                      </div>
                      <b>{pct}%</b>
                    </div>
                    <p className="mute" style={{ fontSize: 12 }}>
                      {tt("clients.budgetLine", { hours: fmt.number(hours, { maximumFractionDigits: 1 }), rate: fmt.number(c.hourlyRate), spent: fmt.number(Math.round(spent)), budget: fmt.number(c.budget) })}
                      {pct >= 80 && <b style={{ color: "var(--bad)" }}> · ⚠️ {pct >= 100 ? tt("clients.overBudget") : tt("clients.used80")}</b>}
                    </p>
                  </Gate>
                  <div className="f2" style={{ margin: "10px 0" }}>
                    <label>
                      {tt("clients.rate")}
                      <input type="number" min={0} value={c.hourlyRate} disabled={!can("CLI-04") || !canEdit} onChange={(e) => updateClient(c.id, { hourlyRate: Number(e.target.value) })} />
                    </label>
                    <label>
                      {tt("clients.budget")}
                      <input type="number" min={0} value={c.budget} disabled={!can("CLI-05") || !canEdit} onChange={(e) => updateClient(c.id, { budget: Number(e.target.value) })} />
                    </label>
                    <label>
                      {tt("clients.autoReport")}
                      <Dropdown<Client["reportDay"]>
                        value={c.reportDay}
                        disabled={!can("NOTIF-06") || !canEdit}
                        onChange={(v) => updateClient(c.id, { reportDay: v })}
                        options={[
                          { value: "Fri", label: tt("clients.everyFri") },
                          { value: "Mon", label: tt("clients.everyMon") },
                          { value: "none", label: tt("common.off") },
                        ]}
                      />
                    </label>
                  </div>
                  <div className="pill-row">
                    <button className="ghost sm" onClick={() => portal(c)} disabled={!can("SPEC-25")}>
                      {tt("clients.copyPortal")} {!can("SPEC-25") && "🔒"}
                    </button>
                    <button className="ghost sm" onClick={() => setReport(c)} disabled={!can("NOTIF-06")}>
                      {tt("clients.previewReport")}
                    </button>
                    <button
                      className="ghost sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/submit/${c.projectId}`);
                        toast(tt("clients.formCopied"));
                      }}
                      disabled={!can("CLI-08")}
                    >
                      {tt("clients.formLink")}
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
              <h2 style={{ margin: 0 }}>{tt("clients.reportPreview", { name: report.name })}</h2>
              <button className="ic" aria-label={tt("clients.closePreview")} onClick={() => setReport(null)}>
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
                {tt("clients.download")}
              </button>
              <button className="ghost sm" onClick={() => window.print()} disabled={!can("CLI-06")}>
                {tt("clients.print")}
              </button>
            </div>
          </div>
        )}
      </Gate>
    </>
  );
}
