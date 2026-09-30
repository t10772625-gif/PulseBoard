"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PERMISSIONS, ROLES, ROLE_INFO, canEditRole, lockedForRole, type PermissionKey, type Role } from "@/lib/permissions";
import Gate from "@/components/Gate";
import { SettingRow, Switch } from "@/components/ui";

const GROUPS: { id: string; title: string; hint: string }[] = [
  { id: "Pages", title: "Pages this role can open", hint: "A hidden page also hides its data in the database." },
  { id: "Tasks", title: "Task actions", hint: "What this role can change on boards and tasks." },
  { id: "Workspace", title: "Workspace actions", hint: "Boards, people, clients, automations and exports." },
];

// Role-by-role permissions. Owner is always full access; only the Owner changes
// Admin; an Admin controls Sub Admin, Member and Viewer. Viewer can only be given
// pages. The same rules are enforced by the database (has_permission + RLS).
export default function PermissionsPage() {
  const { permissions, setPermission, resetPermissions, myRole, allowed, realMode, toast } = useStore();
  const canManage = allowed("member.manage");
  const [role, setRole] = useState<Role>(ROLES.find((r) => canEditRole(myRole, r)) ?? "Member");
  const editable = canEditRole(myRole, role);

  const lockReason =
    role === "Owner" ? "The Owner always has full access." : !editable ? `Only the Owner can change the ${role} role.` : null;

  return (
    <>
      <div className="top">
        <div>
          <p className="mute">
            <Link className="link" href="/settings">
              Settings
            </Link>{" "}
            / Roles &amp; permissions
          </p>
          <h1>Roles &amp; permissions</h1>
          <p className="mute">Pick a role, then choose which pages it sees and what it can do. Your plan decides which features exist; this decides who can use them.</p>
        </div>
      </div>

      {!canManage ? (
        <div className="card">
          <p>Only people with the &quot;Invite members, change roles &amp; permissions&quot; permission can edit this. Your role: {myRole}.</p>
        </div>
      ) : (
        <Gate id="SEC-05">
          <div className="perm-tabs">
            <div className="tabs" role="tablist" aria-label="Role">
              {ROLES.map((r) => (
                <button key={r} role="tab" aria-selected={r === role} className={r === role ? "on" : ""} onClick={() => setRole(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="meta">
              <div>
                <h2 style={{ margin: 0 }}>{role}</h2>
                <p className="mute">{ROLE_INFO[role]}</p>
              </div>
              {editable && (
                <button
                  className="ghost"
                  onClick={() => {
                    resetPermissions(role);
                    toast(`${role} reset to defaults`);
                  }}
                >
                  Reset to defaults
                </button>
              )}
            </div>
            {lockReason && (
              <p className="mute" style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                <Lock size={14} aria-hidden /> {lockReason}
              </p>
            )}
          </div>

          <div className="grid g3 perm-groups">
            {GROUPS.map((g) => {
              const items = PERMISSIONS.filter((p) => p.group === g.id);
              const viewOnly = role === "Viewer" && g.id !== "Pages";
              return (
                <div className="card" key={g.id}>
                  <h2>{g.title}</h2>
                  <p className="mute" style={{ fontSize: 12, marginBottom: 6 }}>
                    {viewOnly ? "Viewer is view-only, so these are always off." : g.hint}
                  </p>
                  {items.map((p) => {
                    const key = p.key as PermissionKey;
                    const locked = lockedForRole(role, key);
                    const on = role === "Owner" || (!locked && permissions[role][key]);
                    return (
                      <SettingRow key={key} title={p.label}>
                        <Switch label={`${role}: ${p.label}`} checked={on} disabled={!editable || locked} onChange={(v) => setPermission(role, key, v)} />
                      </SettingRow>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <p className="mute" style={{ fontSize: 12, marginTop: 10 }}>
            {realMode
              ? "Changes are saved to the workspace and enforced by the database for everyone."
              : "Demo mode: changes apply in this browser. With Supabase they're saved and enforced by the database."}{" "}
            Preview a role from Settings → &quot;Preview the app as&quot;.
          </p>
        </Gate>
      )}
    </>
  );
}
