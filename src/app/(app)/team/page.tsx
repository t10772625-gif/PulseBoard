"use client";
import { useStore } from "@/lib/store";
import { WEEKDAYS, WORKLOAD } from "@/lib/mock-data";
import { Member, MemberId } from "@/types";
import { Avatar } from "@/components/ui";
import Dropdown from "@/components/Dropdown";

const ROLES: Member["role"][] = ["Owner", "Admin", "Member", "Viewer"];

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
  const { members, tasks, setMemberRole, vote, setVote, toast, openInviteModal } = useStore();

  return (
    <>
      <div className="top">
        <div>
          <h1>Team</h1>
          <p className="mute">Workload for this week, in planned hours per day</p>
        </div>
        <button className="ghost" onClick={openInviteModal}>
          Invite member
        </button>
      </div>

      <div className="grid g3" style={{ marginBottom: 18 }}>
        {(Object.keys(members) as MemberId[]).map((k) => {
          const hours = WORKLOAD[k];
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
                    options={ROLES.map((r) => ({ value: r, label: r }))}
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
