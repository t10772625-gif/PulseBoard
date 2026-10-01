"use client";
import { useParams } from "next/navigation";
import { useStore, health } from "@/lib/store";
import { DueLabel } from "@/components/ui";
import { useT } from "@/i18n/I18nProvider";
import { STATUS_LABEL } from "@/lib/mock-data";

// Read-only client portal (COL-04/05, CLI-01, SPEC #25). No edit controls and no
// internal comments are rendered; revoked links show nothing.
export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const { shareLinks, tasks, projects, branding, columnLabel, updateTask } = useStore();
  const link = shareLinks.find((l) => l.token === token);
  const { t: tt, rich } = useT();

  const shell = (children: React.ReactNode) => (
    <div className="page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="meta" style={{ marginBottom: 18 }}>
        <span className="logo">
          <b style={branding.name !== "PulseBoard" ? { background: branding.color } : undefined}></b>
          {branding.name}
        </span>
        <span className="chip">{tt("share.readOnly")}</span>
      </div>
      {children}
      <p className="mute" style={{ fontSize: 11, marginTop: 24 }}>
        {tt("share.demoNote")}
      </p>
    </div>
  );

  if (!link || link.revoked) return shell(<div className="card">{tt("share.invalid")}</div>);

  if (link.kind === "task") {
    const t = tasks.find((x) => x.id === link.targetId);
    if (!t) return shell(<div className="card">{tt("share.taskGone")}</div>);
    return shell(
      <div className="card">
        <p className="mute">{projects[t.projectId].name}</p>
        <h1>{t.title}</h1>
        <p style={{ margin: "10px 0" }}>{t.description}</p>
        <p>
          {rich("share.status", { status: columnLabel(t.projectId, t.status) })} · <DueLabel task={t} />
        </p>
        {t.subtasks.length > 0 && (
          <p className="mute" style={{ marginTop: 8 }}>
            {tt("share.steps", { done: t.subtasks.filter((s) => s[1]).length, total: t.subtasks.length })}
          </p>
        )}
      </div>
    );
  }

  const p = projects[link.targetId];
  if (!p) return shell(<div className="card">{tt("share.boardGone")}</div>);
  const ts = tasks.filter((t) => t.projectId === p.id);
  const h = health(p.id, tasks);
  const groups: [string, typeof ts][] = [
    [STATUS_LABEL.todo, ts.filter((t) => t.status === "todo")],
    [STATUS_LABEL.prog, ts.filter((t) => t.status !== "todo" && t.status !== "done")],
    [STATUS_LABEL.done, ts.filter((t) => t.status === "done")],
  ];
  const approvals = ts.filter((t) => t.approval === "requested");
  return shell(
    <>
      <h1>{p.name}</h1>
      <p className="mute" style={{ marginBottom: 14 }}>
        {p.description} · {tt("share.health")} <b style={{ color: h.color }}>{h.score}</b>
      </p>
      <div className="grid g3" style={{ marginBottom: 18 }}>
        {groups.map(([label, list]) => (
          <div key={label} className="card">
            <p className="mute">{label}</p>
            <div className="stat">{list.length}</div>
          </div>
        ))}
      </div>
      {approvals.length > 0 && (
        <div className="card" style={{ marginBottom: 18, borderTop: `4px solid ${branding.color}` }}>
          <h2>{tt("share.waiting")}</h2>
          {approvals.map((t) => (
            <div key={t.id} className="sugg">
              <b>{t.title}</b>
              <span className="pill-row">
                <button className="btn sm" onClick={() => updateTask(t.id, { approval: "approved" }, tt("clients.actApproved"))}>
                  {tt("share.approve")}
                </button>
                <button className="ghost sm" onClick={() => updateTask(t.id, { approval: "rejected" }, tt("clients.actChanges"))}>
                  {tt("clients.requestChanges")}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <table className="tbl">
          <tbody>
            <tr>
              <th>{tt("board.colTask")}</th>
              <th>{tt("common.status")}</th>
              <th>{tt("board.colDue")}</th>
            </tr>
            {ts.map((t) => (
              <tr key={t.id} style={{ cursor: "default" }}>
                <td>{t.title}</td>
                <td>{columnLabel(p.id, t.status)}</td>
                <td>
                  <DueLabel task={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
