"use client";
import { useParams } from "next/navigation";
import { useStore, health } from "@/lib/store";
import { DueLabel } from "@/components/ui";

// Read-only client portal (COL-04/05, CLI-01, SPEC #25). No edit controls and no
// internal comments are rendered; revoked links show nothing.
export default function SharedView() {
  const { token } = useParams<{ token: string }>();
  const { shareLinks, tasks, projects, branding, columnLabel, updateTask } = useStore();
  const link = shareLinks.find((l) => l.token === token);

  const shell = (children: React.ReactNode) => (
    <div className="page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="meta" style={{ marginBottom: 18 }}>
        <span className="logo">
          <b style={branding.name !== "PulseBoard" ? { background: branding.color } : undefined}></b>
          {branding.name}
        </span>
        <span className="chip">Read-only</span>
      </div>
      {children}
      <p className="mute" style={{ fontSize: 11, marginTop: 24 }}>
        Demo note: without a backend, shared links only open in the browser session that created them.
      </p>
    </div>
  );

  if (!link || link.revoked) return shell(<div className="card">This link is invalid or has been revoked.</div>);

  if (link.kind === "task") {
    const t = tasks.find((x) => x.id === link.targetId);
    if (!t) return shell(<div className="card">This task no longer exists.</div>);
    return shell(
      <div className="card">
        <p className="mute">{projects[t.projectId].name}</p>
        <h1>{t.title}</h1>
        <p style={{ margin: "10px 0" }}>{t.description}</p>
        <p>
          Status: <b>{columnLabel(t.projectId, t.status)}</b> · <DueLabel task={t} />
        </p>
        {t.subtasks.length > 0 && (
          <p className="mute" style={{ marginTop: 8 }}>
            {t.subtasks.filter((s) => s[1]).length}/{t.subtasks.length} steps done
          </p>
        )}
      </div>
    );
  }

  const p = projects[link.targetId];
  if (!p) return shell(<div className="card">This board no longer exists.</div>);
  const ts = tasks.filter((t) => t.projectId === p.id);
  const h = health(p.id, tasks);
  const groups: [string, typeof ts][] = [
    ["To do", ts.filter((t) => t.status === "todo")],
    ["In progress", ts.filter((t) => t.status !== "todo" && t.status !== "done")],
    ["Done", ts.filter((t) => t.status === "done")],
  ];
  const approvals = ts.filter((t) => t.approval === "requested");
  return shell(
    <>
      <h1>{p.name}</h1>
      <p className="mute" style={{ marginBottom: 14 }}>
        {p.description} · Health <b style={{ color: h.color }}>{h.score}</b>
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
          <h2>Waiting for your approval</h2>
          {approvals.map((t) => (
            <div key={t.id} className="sugg">
              <b>{t.title}</b>
              <span className="pill-row">
                <button className="btn sm" onClick={() => updateTask(t.id, { approval: "approved" }, "Client approved this")}>
                  Approve
                </button>
                <button className="ghost sm" onClick={() => updateTask(t.id, { approval: "rejected" }, "Client requested changes")}>
                  Request changes
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
              <th>Task</th>
              <th>Status</th>
              <th>Due</th>
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
