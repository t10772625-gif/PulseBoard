"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { TODAY, WORKLOAD } from "@/lib/mock-data";
import { MemberId } from "@/types";
import { estimateFor } from "@/lib/ai";
import { Avatar } from "@/components/ui";
import Dropdown from "@/components/Dropdown";
import Gate from "@/components/Gate";
import { ROLES, assignableRoles } from "@/lib/permissions";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";


const MOODS: [string, MessageKey][] = [
  ["😀", "team.moodGreat"],
  ["🙂", "team.moodGood"],
  ["😐", "team.moodOkay"],
  ["😕", "team.moodTough"],
];
const WEEKDAY_COUNT = 5;

function heatColor(v: number) {
  if (v >= 9) return "#E5483A";
  if (v >= 7) return "#F0A400";
  if (v >= 4) return "#12B5A0";
  return "#7FB8B0";
}

export default function Team() {
  const { members, tasks, setMemberRole, vote, setVote, toast, openInviteModal, capacity, setCapacity, history, allowed, myRole, realMode, invites, refreshInvites, revokeInvite, creatorId } = useStore();
  const canManage = allowed("member.manage");
  const { t: tt, fmt } = useT();
  // Mon–Fri names in the current language (5 Jan 2026 was a Monday)
  const weekdays = Array.from({ length: WEEKDAY_COUNT }, (_, i) => fmt.date(new Date(2026, 0, 5 + i), { weekday: "short" }));

  useEffect(() => {
    if (realMode && canManage) void refreshInvites();
  }, [realMode, canManage, refreshInvites]);

  // Real mode: hours per weekday = estimates of open tasks due that day this week.
  // Demo mode keeps the sample workload.
  const monday = -((TODAY.getDay() + 6) % 7);
  const weekHours = (k: MemberId): number[] =>
    realMode
      ? weekdays.map((_, i) =>
          tasks.filter((t) => t.assignee === k && t.status !== "done" && t.dueOffset === monday + i).reduce((sum, t) => sum + estimateFor(t, history), 0)
        )
      : WORKLOAD[k] ?? [0, 0, 0, 0, 0];

  return (
    <>
      <div className="top">
        <div>
          <h1>{tt("team.title")}</h1>
          <p className="mute">
            {tt("team.hint")}
            {realMode ? ` ${tt("team.hintReal")}` : ""}
          </p>
        </div>
        {canManage && (
          <button className="ghost" onClick={openInviteModal}>
            {tt("team.invite")}
          </button>
        )}
      </div>

      {realMode && canManage && invites.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h2>{tt("team.pending")}</h2>
          <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
            {tt("team.pendingHint")}
          </p>
          <table className="tbl">
            <tbody>
              <tr>
                <th>{tt("common.email")}</th>
                <th>{tt("common.role")}</th>
                <th>{tt("team.expires")}</th>
                <th />
              </tr>
              {invites.map((i) => (
                <tr key={i.id} style={{ cursor: "default" }}>
                  <td dir="ltr">{i.email}</td>
                  <td>{tt(`role.${i.role}`)}</td>
                  <td>{new Date(i.expiresAt) < new Date() ? tt("team.expired") : fmt.date(i.expiresAt)}</td>
                  <td style={{ textAlign: "end" }}>
                    <button
                      className="ghost"
                      onClick={() => {
                        void revokeInvite(i.id);
                        toast(tt("team.revoked", { email: i.email }));
                      }}
                    >
                      {tt("team.revoke")}
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
                  {k === creatorId && <span className="chip" style={{ marginInlineStart: 6 }} title={tt("team.creatorHint")}>{tt("team.creator")}</span>}
                  <br />
                  <Dropdown
                    value={members[k].role}
                    onChange={(role) => {
                      setMemberRole(k, role);
                      toast(tt("team.roleUpdated", { role: tt(`role.${role}`) }));
                    }}
                    // Only an Admin grants or changes Admin; nobody changes their own role, and the
                    // workspace creator's role can't be changed (same rules in the database)
                    disabled={!canManage || k === "me" || k === creatorId || !assignableRoles(myRole).includes(members[k].role)}
                    options={(assignableRoles(myRole).includes(members[k].role) ? assignableRoles(myRole) : [members[k].role]).map((r) => ({ value: r, label: tt(`role.${r}`) }))}
                    triggerStyle={{ padding: "3px 8px", fontSize: 12, marginTop: 4, width: "auto" }}
                  />
                </div>
              </div>
              <div className="heat">
                {hours.map((v, i) => (
                  <div key={i} style={{ background: heatColor(v) }} title={weekdays[i]}>
                    {tt("team.hours", { n: v })}
                  </div>
                ))}
              </div>
              <p className="mute" style={{ marginTop: 10 }}>
                <b style={{ color: over ? "#E5483A" : "inherit" }}>{tt("team.thisWeek", { n: total })}</b>
                {over ? tt("team.overloaded") : tt("team.within")}. {tt("team.openTasks", { n: openTasks })}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid g2" style={{ marginBottom: 18 }}>
        <div className="card">
          <h2>{tt("team.capacityTitle")}</h2>
          <Gate id="TIME-11">
            <p className="mute" style={{ fontSize: 12, marginBottom: 8 }}>
              {tt("team.capacityHint")}
            </p>
            <table className="tbl">
              <tbody>
                <tr>
                  <th>{tt("team.colMember")}</th>
                  <th>{tt("team.colAvailable")}</th>
                  <th>{tt("team.colCommitted")}</th>
                  <th>{tt("team.colMax")}</th>
                </tr>
                {(Object.keys(members) as MemberId[]).map((k) => {
                  // Meeting hours are sample data; with a real workspace there's no calendar source yet
                  const meetings = realMode ? 0 : Math.max(0, (WORKLOAD[k] ?? [0, 0, 0, 0, 0]).reduce((a, b) => a + b, 0) - 36);
                  const available = 40 - meetings;
                  const committed = tasks.filter((t) => t.assignee === k && t.status !== "done").reduce((s, t) => s + estimateFor(t, history), 0);
                  return (
                    <tr key={k} style={{ cursor: "default" }}>
                      <td>{members[k].name}</td>
                      <td>{tt("team.hours", { n: available })}</td>
                      <td style={{ color: committed > available ? "var(--bad)" : undefined, fontWeight: 700 }}>
                        {tt("team.hours", { n: committed })}
                        {committed > available ? tt("team.overcommitted") : ""}
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
          <h2>{tt("team.org")}</h2>
          <Gate id="COL-10">
            {ROLES.map((r) => {
              const people = (Object.keys(members) as MemberId[]).filter((k) => members[k].role === r);
              if (!people.length) return null;
              return (
                <div key={r} className="org-level">
                  <span className="mute" style={{ fontSize: 12 }}>{tt(`role.${r}`)}</span>
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
        <h2>{tt("team.pulse")}</h2>
        <p className="mute" style={{ marginBottom: 12 }}>
          {tt("team.pulseHint")}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {MOODS.map(([emoji, label], i) => (
            <button
              key={label}
              className={`ghost ${vote === i ? "on" : ""}`}
              style={{ fontSize: 15 }}
              onClick={() => {
                setVote(i);
                toast(tt("team.pulseThanks"));
              }}
            >
              {emoji} {tt(label)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
