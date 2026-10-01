"use client";
import { Info, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PERMISSIONS, ROLES, canEditRole, lockedForRole, type PermissionKey, type Role } from "@/lib/permissions";
import Gate from "@/components/Gate";
import { SettingRow, Switch } from "@/components/ui";
import Dropdown from "@/components/Dropdown";
import SettingsHeader from "@/components/SettingsHeader";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// One colour per role for the overview (dot + bars)
const ROLE_COLOR: Record<Role, string> = { Owner: "#12b5a0", Admin: "#3a86ff", "Sub Admin": "#9b6cff", Member: "#f0a400", Viewer: "#8ca3b4" };

function Meter({ n, total }: { n: number; total: number }) {
  return (
    <span className="st-meter">
      <b>
        {n}/{total}
      </b>
      <span className="st-meter-bar" aria-hidden>
        <i style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
      </span>
    </span>
  );
}

const GROUPS: { id: string; title: MessageKey; hint: MessageKey }[] = [
  { id: "Pages", title: "permPage.groupPages", hint: "permPage.groupPagesHint" },
  { id: "Tasks", title: "permPage.groupTasks", hint: "permPage.groupTasksHint" },
  { id: "Workspace", title: "permPage.groupWorkspace", hint: "permPage.groupWorkspaceHint" },
];

// Role-by-role permissions. Owner is always full access; only the Owner changes
// Admin; an Admin controls Sub Admin, Member and Viewer. Viewer can only be given
// pages. The same rules are enforced by the database (has_permission + RLS).
export default function PermissionsPage() {
  const { permissions, setPermission, resetPermissions, myRole, allowed, realMode, toast, viewAsRole, setViewAsRole } = useStore();
  const { t } = useT();
  const roleName = (r: Role) => t(`role.${r}`);
  const permLabel = (k: PermissionKey) => t(`perm.${k}`);
  const canManage = allowed("member.manage");
  const [role, setRole] = useState<Role>(ROLES.find((r) => canEditRole(myRole, r)) ?? "Member");
  const editable = canEditRole(myRole, role);

  const lockReason = role === "Owner" ? t("permPage.lockOwner") : !editable ? t("permPage.lockOnlyOwner", { role: roleName(role) }) : null;

  return (
    <>
      <SettingsHeader title={t("permPage.title")} hint={t("permPage.hint")} />

      {/* Overview (was the Roles & permissions card on the old single Settings page) */}
      <section className="card st-roles" style={{ marginBottom: 14 }} aria-labelledby="st-role-h">
        <div className="st-card-head">
          <h2 id="st-role-h">{t("permPage.yourRole", { role: roleName(myRole) })}</h2>
          {/* Only claim database enforcement when the workspace really is in the database */}
          <span className={`st-pill ${realMode ? "" : "muted"}`}>
            <ShieldCheck size={13} aria-hidden /> {realMode ? t("permPage.rlsOn") : t("permPage.rlsDemo")}
          </span>
          {!canManage && <span className="chip">{t("common.viewOnly")}</span>}
        </div>
        <p className="mute st-foot" style={{ marginTop: 0 }}>
          <Info size={14} aria-hidden /> {t("permPage.overviewHint")}
        </p>
        <div className="st-table-wrap">
          <table className="tbl st-role-table">
            <thead>
              <tr>
                <th>{t("permPage.colRole")}</th>
                <th>{t("permPage.colPages")}</th>
                <th>{t("permPage.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => {
                const row = permissions[r];
                const pageTotal = PERMISSIONS.filter((p) => p.group === "Pages").length;
                const actionTotal = PERMISSIONS.filter((p) => p.group !== "Pages").length;
                const pages = PERMISSIONS.filter((p) => p.group === "Pages" && (r === "Owner" || row[p.key])).length;
                const actions = PERMISSIONS.filter((p) => p.group !== "Pages" && (r === "Owner" || row[p.key])).length;
                return (
                  <tr key={r} className={r === myRole ? "st-you" : ""} style={{ cursor: "default" }}>
                    <td>
                      <span className="st-dot" style={{ background: ROLE_COLOR[r] }} aria-hidden />
                      <b>{roleName(r)}</b>
                    </td>
                    <td>
                      <Meter n={pages} total={pageTotal} />
                    </td>
                    <td>
                      <Meter n={actions} total={actionTotal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(myRole === "Owner" || myRole === "Admin") && (
          <label className="st-field">
            {t("permPage.previewAs")}
            <Dropdown
              value={viewAsRole}
              onChange={setViewAsRole}
              style={{ display: "block" }}
              // You can only preview your own role or a lower one
              options={ROLES.slice(ROLES.indexOf(myRole)).map((r) => ({ value: r, label: r === myRole ? t("permPage.youSuffix", { role: roleName(r) }) : roleName(r) }))}
            />
          </label>
        )}
        <p className="st-lock-note">
          <Lock size={15} aria-hidden />
          <span>
            {t("permPage.editingNeeds")}{" "}
            <Gate id="SEC-05" compact>
              <b>{t("plan.legendary")}</b>
            </Gate>{" "}
            {t("permPage.editingNeedsEnd")}
          </span>
        </p>
      </section>

      {!canManage ? (
        <div className="card">
          <p>{t("permPage.cantManage", { role: roleName(myRole) })}</p>
        </div>
      ) : (
        <Gate id="SEC-05">
          <div className="perm-tabs">
            <div className="tabs" role="tablist" aria-label={t("permPage.roleTabs")}>
              {ROLES.map((r) => (
                <button key={r} role="tab" aria-selected={r === role} className={r === role ? "on" : ""} onClick={() => setRole(r)}>
                  {roleName(r)}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="meta">
              <div>
                <h2 style={{ margin: 0 }}>{roleName(role)}</h2>
                <p className="mute">{t(`roleInfo.${role}`)}</p>
              </div>
              {editable && (
                <button
                  className="ghost"
                  onClick={() => {
                    resetPermissions(role);
                    toast(t("permPage.resetToast", { role: roleName(role) }));
                  }}
                >
                  {t("permPage.resetDefaults")}
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
                  <h2>{t(g.title)}</h2>
                  <p className="mute" style={{ fontSize: 12, marginBottom: 6 }}>
                    {viewOnly ? t("permPage.viewerOff") : t(g.hint)}
                  </p>
                  {items.map((p) => {
                    const key = p.key as PermissionKey;
                    const locked = lockedForRole(role, key);
                    const on = role === "Owner" || (!locked && permissions[role][key]);
                    return (
                      <SettingRow key={key} title={permLabel(key)}>
                        <Switch label={`${roleName(role)}: ${permLabel(key)}`} checked={on} disabled={!editable || locked} onChange={(v) => setPermission(role, key, v)} />
                      </SettingRow>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <p className="mute" style={{ fontSize: 12, marginTop: 10 }}>
            {realMode ? t("permPage.savedReal") : t("permPage.savedDemo")} {t("permPage.previewTip")}
          </p>
        </Gate>
      )}
    </>
  );
}
