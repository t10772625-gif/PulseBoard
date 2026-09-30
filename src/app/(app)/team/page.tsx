"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { TODAY, WEEKDAYS, WORKLOAD } from "@/lib/mock-data";
import { MemberId } from "@/types";
import { estimateFor } from "@/lib/ai";
import { Avatar } from "@/components/ui";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { ROLES, assignableRoles } from "@/lib/permissions";


const MOODS: [string, string][] = [
  ["😀", "Great"],
  ["🙂", "Good"],
  ["😐", "Okay"],
  ["😕", "Tough"],
];

function heatColor(v: number) {
  if (v >= 9) return "#E5483A";
  if (v >= 7) return "#F0A400";
  if (v >= 4) return "#12B5A0";
  return "#7FB8B0";
}

export default function Team() {
  const { members, tasks, setMemberRole, vote, setVote, toast, openInviteModal, capacity, setCapacity, history, allowed, myRole, realMode, invites, refreshInvites, revokeInvite } = useStore();
  const canManage = allowed("member.manage");

  useEffect(() => {
    if (realMode && canManage) void refreshInvites();
  }, [realMode, canManage, refreshInvites]);

  // Real mode: hours per weekday = estimates of open tasks due that day this week.
  // Demo mode keeps the sample workload.
  const monday = -((TODAY.getDay() + 6) % 7);
  const weekHours = (k: MemberId): number[] =>
    realMode
      ? WEEKDAYS.map((_, i) =>
          tasks.filter((t) => t.assignee === k && t.status !== "done" && t.dueOffset === monday + i).reduce((sum, t) => sum + estimateFor(t, history), 0)
        )
      : WORKLOAD[k] ?? [0, 0, 0, 0, 0];

  return (
    <>
      <div className="top">
        <div>
          <h1>Team</h1>
          <p className="mute">
            Workload for this week, in planned hours per day{realMode ? " (from task estimates and due dates)" : ""}
          </p>
        </div>
        {canManage && (
          <button className="ghost" onClick={openInviteModal}>
            Invite member
          </button>
        )}
      </div>

      {realMode && canManage && invites.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h2>Pending access</h2>
          <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
            These emails join this workspace when they sign up. No email is sent yet.
          </p>
          <table className="tbl">
            <tbody>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Expires</th>
                <th />
              </tr>
              {invites.map((i) => (
                <tr key={i.id} style={{ cursor: "default" }}>
                  <td>{i.email}</td>
                  <td>{i.role}</td>
                  <td>{new Date(i.expiresAt) < new Date() ? "Expired" : new Date(i.expiresAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="ghost"
                      onClick={() => {
                        void revokeInvite(i.id);
                        toast("Access revoked for " + i.email);
                      }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid g3" style={{ marginBottom: 18 }}>
        {(Object.keys(members) as MemberId[]).map((k) => {
          const hours = weekHours(k);
          const total = hours.reduce((a, b) => a + b, 0);
          const over = total > 40;
          const openTasks = tasks.filter((t) => t.assignee === k && t.status !== "done").length;
          return (
            <div className="card" key={k}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <Avatar id={k} large />
                <div>
                  <b>{members[k].name}</b>
                  <br />
                  <Dropdown
                    value={members[k].role}
                    onChange={(role) => {
                      setMemberRole(k, role);
                      toast("Role updated to " + role);
                    }}
                    // Only the Owner grants or changes Owner/Admin; nobody changes their own role here
                    disabled={!canManage || k === "me" || !assignableRoles(myRole).includes(members[k].role)}
                    options={(assignableRoles(myRole).includes(members[k].role) ? assignableRoles(myRole) : [members[k].role]).map((r) => ({ value: r, label: r }))}
                    triggerStyle={{ padding: "3px 8px", fontSize: 12, marginTop: 4, width: "auto" }}
                  />
                </div>
              </div>
              <div className="heat">
                {hours.map((v, i) => (
                  <div key={i} style={{ background: heatColor(v) }} title={WEEKDAYS[i]}>
                    {v}h
                  </div>
                ))}
              </div>
              <p className="mute" style={{ marginTop: 10 }}>
                <b style={{ color: over ? "#E5483A" : "inherit" }}>{total}h this week</b>
                {over ? ", overloaded" : ", within capacity"}. {openTasks} open tasks.
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid g2" style={{ marginBottom: 18 }}>
        <div className="card">
          <h2>Weekly capacity planning</h2>
          <Gate id="TIME-11">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
              Available = 40h minus planned meeting hours. Committed = estimates of open tasks. Capacity (max open tasks) drives workload balancing.
            </p>
            <table className="tbl">
              <tbody>
                <tr>
                  <th>Member</th>
                  <th>Available</th>
                  <th>Committed</th>
                  <th>Max open tasks</th>
                </tr>
                {(Object.keys(members) as MemberId[]).map((k) => {
                  // Meeting hours are sample data; with a real workspace there's no calendar source yet
                  const meetings = realMode ? 0 : Math.max(0, (WORKLOAD[k] ?? [0, 0, 0, 0, 0]).reduce((a, b) => a + b, 0) - 36);
                  const available = 40 - meetings;
                  const committed = tasks.filter((t) => t.assignee === k && t.status !== "done").reduce((s, t) => s + estimateFor(t, history), 0);
                  return (
                    <tr key={k} style={{ cursor: "default" }}>
                      <td>{members[k].name}</td>
                      <td>{available}h</td>
                      <td style={{ color: committed > available ? "var(--bad)" : undefined, fontWeight: 700 }}>
                        {committed}h{committed > available ? " · overcommitted" : ""}
                      </td>
                      <td>
                        <input type="number" min={1} style={{ width: 64 }} value={capacity[k] ?? 5} disabled={!canManage} onChange={(e) => setCapacity(k, Number(e.target.value))} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Gate>
        </div>
        <div className="card">
          <h2>Org chart</h2>
          <Gate id="COL-10">
            {ROLES.map((r) => {
              const people = (Object.keys(members) as MemberId[]).filter((k) => members[k].role === r);
              if (!people.length) return null;
              return (
                <div key={r} className="org-level">
                  <span className="mute" style={{ fontSize: 12 }}>{r}</span>
                  <div className="pill-row" style={{ justifyContent: "center" }}>
                    {people.map((k) => (
                      <span key={k} className="chip" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <Avatar id={k} /> {members[k].name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </Gate>
        </div>
      </div>

      <div className="card">
        <h2>Team pulse check-in</h2>
        <p className="mute" style={{ marginBottom: 12 }}>
          How did this week feel? Answers are anonymous and shown as a trend.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {MOODS.map(([emoji, label], i) => (
            <button
              key={label}
              className={`ghost ${vote === i ? "on" : ""}`}
              style={{ fontSize: 15 }}
              onClick={() => {
                setVote(i);
                toast("Thanks, your pulse is recorded");
              }}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
