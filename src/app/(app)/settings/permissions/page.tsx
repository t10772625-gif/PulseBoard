"use client";
import { useState } from "react";
import { Bot, Briefcase, Check, Columns3, Copy, CornerDownRight, Database, Eye, Info, KanbanSquare, Link2, Lock, MessageSquare, Paperclip, Plug, RotateCcw, ShieldCheck, SlidersHorizontal, SquareCheckBig, Users, X, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { PERMISSIONS, ROLES, canEditRole, lockedForRole, type PermissionKey, type Role } from "@/lib/permissions";
import Gate, { PlanTag } from "@/components/Gate";
import { Switch } from "@/components/ui";
import Dropdown from "@/components/Dropdown";
import SettingsHeader from "@/components/SettingsHeader";
import { SecHead } from "@/components/FeaturePage";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// One colour per role (dot next to the name; the name is always shown too)
const ROLE_COLOR: Record<Role, string> = { Admin: "#12b5a0", "Sub Admin": "#9b6cff", Member: "#f0a400", Viewer: "#8ca3b4" };

type Act = "view" | "create" | "edit" | "move" | "delete" | "other";
const ACTS: { id: Act; label: MessageKey }[] = [
  { id: "view", label: "permPage.act.view" },
  { id: "create", label: "permPage.act.create" },
  { id: "edit", label: "permPage.act.edit" },
  { id: "move", label: "permPage.act.move" },
  { id: "delete", label: "permPage.act.delete" },
  { id: "other", label: "permPage.act.other" },
];

// A cell is one or more permission switches, a fixed rule (text), or not applicable.
// `linked` marks a switch that today also controls another column (one permission
// in the database); Phase 2 splits them (task.move, project.create/edit/delete).
type Sw = { key: PermissionKey; label?: MessageKey; linked?: MessageKey };
type Cell = Sw[] | { text: MessageKey } | null;
type Resource = { id: string; label: MessageKey; icon: LucideIcon; cells: Record<Act, Cell> };

const RESOURCES: Resource[] = [
  {
    id: "tasks",
    label: "permPage.res.tasks",
    icon: SquareCheckBig,
    cells: {
      view: [{ key: "page.projects" }],
      create: [{ key: "task.create" }],
      edit: [
        { key: "task.edit", label: "permPage.scopeOwn" },
        { key: "task.edit_all", label: "permPage.scopeAnyEditMove" },
      ],
      move: [{ key: "task.move", label: "permPage.moveScope" }],
      delete: [
        { key: "task.delete", label: "permPage.scopeOwn" },
        { key: "task.delete_all", label: "permPage.scopeAny" },
      ],
      other: [
        { key: "task.assign", label: "permPage.act.assign" },
        { key: "task.archive", label: "permPage.act.archive" },
      ],
    },
  },
  {
    id: "boards",
    label: "permPage.res.boards2",
    icon: KanbanSquare,
    cells: { view: [{ key: "page.projects" }], create: [{ key: "project.create" }], edit: [{ key: "project.edit" }], move: null, delete: [{ key: "project.delete" }], other: null },
  },
  {
    id: "columns",
    label: "permPage.res.columns",
    icon: Columns3,
    cells: { view: { text: "permPage.rule.withBoard" }, create: [{ key: "column.create" }], edit: [{ key: "column.edit", label: "permPage.columnEditHint" }], move: null, delete: [{ key: "column.delete" }], other: null },
  },
  {
    id: "comments",
    label: "permPage.res.comments",
    icon: MessageSquare,
    cells: {
      view: { text: "permPage.rule.allMembers" },
      create: [{ key: "comment.create" }],
      edit: { text: "permPage.rule.ownOnly" },
      move: null,
      delete: [{ key: "comment.delete_all", label: "permPage.scopeAnyOwnAlways" }],
      other: null,
    },
  },
  {
    id: "files",
    label: "permPage.res.files",
    icon: Paperclip,
    cells: {
      view: { text: "permPage.rule.allMembers" },
      create: [{ key: "file.upload" }],
      edit: null,
      move: null,
      delete: [
        { key: "file.delete", label: "permPage.scopeOwnUploads" },
        { key: "file.delete_all", label: "permPage.scopeAny" },
      ],
      other: null,
    },
  },
  {
    id: "share",
    label: "permPage.res.share",
    icon: Link2,
    cells: { view: null, create: [{ key: "share.create" }], edit: null, move: null, delete: [{ key: "share.revoke_all", label: "permPage.scopeAnyOwnAlways" }], other: null },
  },
  {
    id: "clients",
    label: "permPage.res.clients",
    icon: Briefcase,
    cells: { view: [{ key: "page.clients" }], create: [{ key: "client.create" }], edit: [{ key: "client.edit" }], move: null, delete: [{ key: "client.delete" }], other: null },
  },
  {
    id: "members",
    label: "permPage.res.members",
    icon: Users,
    cells: { view: [{ key: "page.team" }], create: [{ key: "member.invite" }], edit: [{ key: "member.edit" }], move: null, delete: [{ key: "member.remove" }], other: null },
  },
  {
    id: "automations",
    label: "permPage.res.rules",
    icon: Bot,
    cells: { view: [{ key: "page.automations" }], create: [{ key: "automation.create" }], edit: [{ key: "automation.edit" }], move: null, delete: [{ key: "automation.delete" }], other: null },
  },
  {
    id: "integrations",
    label: "permPage.res.integrations",
    icon: Plug,
    cells: { view: [{ key: "page.integrations" }], create: [{ key: "integration.connect" }], edit: [{ key: "integration.edit" }], move: null, delete: [{ key: "integration.disconnect" }], other: null },
  },
  {
    id: "templates",
    label: "permPage.res.templates",
    icon: Copy,
    cells: { view: { text: "permPage.rule.allMembers" }, create: [{ key: "template.create" }], edit: null, move: null, delete: [{ key: "template.delete" }], other: null },
  },
  {
    id: "fields",
    label: "permPage.res.fields",
    icon: SlidersHorizontal,
    cells: { view: { text: "permPage.rule.allMembers" }, create: [{ key: "field.create" }], edit: null, move: null, delete: [{ key: "field.delete" }], other: null },
  },
  {
    id: "data",
    label: "permPage.res.data",
    icon: Database,
    cells: { view: null, create: null, edit: null, move: null, delete: null, other: [{ key: "data.export", label: "permPage.act.export" }] },
  },
];

// The overview compares roles on the questions people ask most
const OVERVIEW: { key: PermissionKey; label: MessageKey }[] = [
  { key: "task.create", label: "permPage.ov.create" },
  { key: "task.edit", label: "permPage.ov.editOwn" },
  { key: "task.edit_all", label: "permPage.ov.editAll" },
  { key: "task.move", label: "permPage.ov.move" },
  { key: "task.assign", label: "permPage.ov.assign" },
  { key: "task.archive", label: "permPage.ov.archive" },
  { key: "task.delete", label: "permPage.ov.deleteOwn" },
  { key: "task.delete_all", label: "permPage.ov.deleteAll" },
  { key: "comment.create", label: "permPage.ov.comment" },
  { key: "file.upload", label: "permPage.ov.fileUpload" },
  { key: "project.create", label: "permPage.ov.boardsCreate2" },
  { key: "project.delete", label: "permPage.ov.boardsDelete" },
  { key: "column.create", label: "permPage.ov.columnsCreate" },
  { key: "column.delete", label: "permPage.ov.columnsDelete" },
  { key: "client.create", label: "permPage.ov.clientsCreate" },
  { key: "member.invite", label: "permPage.ov.invite" },
  { key: "member.edit", label: "permPage.ov.roles" },
  { key: "automation.create", label: "permPage.ov.rulesCreate" },
  { key: "integration.connect", label: "permPage.ov.integrations" },
  { key: "data.export", label: "permPage.ov.export" },
];

// Role-by-role permissions. Admin always has everything and can't be edited; an
// Admin controls Sub Admin, Member and Viewer. Viewer can only be given pages.
// The same rules are enforced by the database (has_permission, RLS policies and
// the task update trigger); the store also checks them before every change.
export default function PermissionsPage() {
  const { permissions, setPermission, resetPermissions, myRole, can, realMode, toast, viewAsRole, setViewAsRole } = useStore();
  const { t } = useT();
  const roleName = (r: Role) => t(`role.${r}`);
  // Only an Admin edits the matrix (role_permissions policy, migration 21)
  const canManage = myRole === "Admin";
  const planAllows = can("SEC-05");
  const [role, setRole] = useState<Role>(ROLES.find((r) => canEditRole(myRole, r)) ?? "Member");
  const editable = canManage && planAllows && canEditRole(myRole, role);
  const has = (r: Role, key: PermissionKey) => r === "Admin" || (!lockedForRole(r, key) && !!permissions[r][key]);

  const lockReason =
    role === "Admin"
      ? t("permPage.lockAdmin")
      : !canManage
        ? t("permPage.cantManage", { role: roleName(myRole) })
        : !planAllows
          ? t("permPage.lockPlan")
          : !canEditRole(myRole, role)
            ? t("permPage.lockOnlyAdmin", { role: roleName(role) })
            : null;

  function renderCell(cell: Cell) {
    if (!cell) return <span className="mute" aria-label={t("permPage.na")}>—</span>;
    if ("text" in cell) return <span className="pm-rule">{t(cell.text)}</span>;
    return (
      <div className="pm-cell">
        {cell.map((sw, i) => {
          const locked = lockedForRole(role, sw.key);
          const label = `${roleName(role)}: ${t(`perm.${sw.key}`)}`;
          return (
            <span key={sw.key + i} className="pm-sw">
              <Switch label={label} checked={has(role, sw.key)} disabled={!editable || locked} onChange={(v) => setPermission(role, sw.key, v)} />
              {sw.label && <small>{t(sw.label)}</small>}
              {sw.linked && <small className="pm-linked">{t(sw.linked)}</small>}
            </span>
          );
        })}
      </div>
    );
  }

  // Sections and their sub-pages (a sub-page switch only matters while its section is on)
  const pagePerms = PERMISSIONS.filter((p) => p.group === "Pages") as readonly { key: PermissionKey; parent?: PermissionKey }[];
  const topPages = pagePerms.filter((p) => !p.parent).map((p) => p.key);
  const subPagesOf = (key: PermissionKey) => pagePerms.filter((p) => p.parent === key).map((p) => p.key);

  return (
    <>
      <SettingsHeader title={t("permPage.title")} hint={t("permPage.hint2")} />
      <div className="ux-page">
        <section className="card ux-sec" aria-labelledby="pm-you">
          <SecHead id="pm-you" icon={ShieldCheck} title={t("permPage.yourRole", { role: roleName(myRole) })}>
            {/* Only claim database enforcement when the workspace really is in the database */}
            <span className={`int-st ${realMode ? "connected" : "setup"}`}>{realMode ? t("permPage.rlsOn") : t("permPage.rlsDemo")}</span>
            <PlanTag id="SEC-05" />
          </SecHead>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("permPage.howEnforced")}
          </p>
          {realMode && (
            <p className="st-demo-warn" style={{ margin: 0 }}>
              <Info size={14} aria-hidden /> {t("permPage.needsMigration26")}
            </p>
          )}
          {myRole === "Admin" && (
            <div className="ux-inline">
              <label style={{ flex: "0 1 280px" }}>
                {t("permPage.previewAs")}
                <Dropdown
                  value={viewAsRole}
                  onChange={setViewAsRole}
                  // You can only preview your own role or a lower one
                  options={ROLES.slice(ROLES.indexOf(myRole)).map((r) => ({ value: r, label: r === myRole ? t("permPage.youSuffix", { role: roleName(r) }) : roleName(r) }))}
                />
              </label>
            </div>
          )}
        </section>

        <section className="card ux-sec" aria-labelledby="pm-ov">
          <SecHead id="pm-ov" icon={Eye} title={t("permPage.ovTitle")} />
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("permPage.ovHint")}
          </p>
          <div className="ux-table-wrap">
            <table className="ux-table pm-ov">
              <thead>
                <tr>
                  <th scope="col">{t("permPage.colAction")}</th>
                  {ROLES.map((r) => (
                    <th scope="col" key={r}>
                      <span className="st-dot" style={{ background: ROLE_COLOR[r] }} aria-hidden /> {roleName(r)}
                    </th>
                  ))}
                  <th scope="col">
                    {t("permPage.clientViewer")} <span className="int-st planned">{t("permPage.phase3")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {OVERVIEW.map((o) => (
                  <tr key={o.label}>
                    <th scope="row" style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0, background: "none", color: "var(--ink)", fontSize: 13.5 }}>
                      {t(o.label)}
                    </th>
                    {ROLES.map((r) => (
                      <td key={r}>
                        {has(r, o.key) ? (
                          <span className="pm-yes">
                            <Check size={15} aria-hidden /> {t("permPage.yes")}
                          </span>
                        ) : (
                          <span className="pm-no">
                            <X size={15} aria-hidden /> {t("permPage.no")}
                          </span>
                        )}
                      </td>
                    ))}
                    <td>
                      <span className="mute">—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mute st-foot" style={{ marginTop: 0 }}>
            <Info size={14} aria-hidden /> {t("permPage.ovFoot2")}
          </p>
        </section>

        <section className="card ux-sec" aria-labelledby="pm-edit">
          <SecHead id="pm-edit" icon={Lock} title={t("permPage.editTitle")}>
            {editable && (
              <button
                className="ghost sm"
                onClick={() => {
                  resetPermissions(role);
                  toast(t("permPage.resetToast", { role: roleName(role) }));
                }}
              >
                <RotateCcw size={14} aria-hidden /> {t("permPage.resetDefaults")}
              </button>
            )}
          </SecHead>
          <div className="tabs" role="tablist" aria-label={t("permPage.roleTabs")}>
            {ROLES.map((r) => (
              <button key={r} role="tab" aria-selected={r === role} className={r === role ? "on" : ""} onClick={() => setRole(r)}>
                {roleName(r)}
              </button>
            ))}
          </div>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t(`roleInfo.${role}`)}
          </p>
          {lockReason && (
            <p className="st-demo-warn" style={{ margin: 0 }}>
              <Lock size={14} aria-hidden /> {lockReason}{" "}
              {!planAllows && canManage && role !== "Admin" && (
                <Gate id="SEC-05" compact>
                  <span />
                </Gate>
              )}
            </p>
          )}
          {role === "Viewer" && <p className="mute" style={{ margin: 0, fontSize: 12 }}>{t("permPage.viewerOff")}</p>}

          <div className="ux-table-wrap">
            <table className="ux-table pm-grid">
              <thead>
                <tr>
                  <th scope="col">{t("permPage.colResource")}</th>
                  {ACTS.map((a) => (
                    <th scope="col" key={a.id}>
                      {t(a.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map((res) => {
                  const Icon = res.icon;
                  return (
                    <tr key={res.id}>
                      <th scope="row" className="pm-res">
                        <span className="ux-actor">
                          <Icon size={16} aria-hidden /> {t(res.label)}
                        </span>
                      </th>
                      {ACTS.map((a) => (
                        <td key={a.id}>{renderCell(res.cells[a.id])}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mute st-foot" style={{ marginTop: 0 }}>
            <Info size={14} aria-hidden /> {t("permPage.gridFoot2")}
          </p>
        </section>

        <section className="card ux-sec" aria-labelledby="pm-pages">
          <SecHead id="pm-pages" icon={Eye} title={t("permPage.groupPages")} />
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>
            {t("permPage.pagesHint")}
          </p>
          <div className="pm-pages">
            {topPages.map((key) => {
              const subs = subPagesOf(key);
              return (
                <div key={key} className={subs.length ? "pm-page-group" : undefined}>
                  <div className="st-row">
                    <div className="st-row-main">
                      <b>{t(`perm.${key}`)}</b>
                      {subs.length > 0 && <p className="mute">{t("permPage.subPagesCount", { n: subs.length })}</p>}
                    </div>
                    <Switch label={`${roleName(role)}: ${t(`perm.${key}`)}`} checked={has(role, key)} disabled={!editable} onChange={(v) => setPermission(role, key, v)} />
                  </div>
                  {subs.map((sub) => (
                    <div key={sub} className="st-row pm-sub">
                      <CornerDownRight size={14} aria-hidden className="mute flip-rtl" />
                      <div className="st-row-main">
                        <span>{t(`perm.${sub}`)}</span>
                      </div>
                      <Switch
                        label={`${roleName(role)}: ${t(`perm.${sub}`)}`}
                        checked={has(role, sub) && has(role, key)}
                        disabled={!editable || !has(role, key)}
                        onChange={(v) => setPermission(role, sub, v)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="mute st-foot" style={{ marginTop: 0 }}>
            <Info size={14} aria-hidden /> {realMode ? t("permPage.savedReal") : t("permPage.savedDemo")}
          </p>
        </section>
      </div>
    </>
  );
}
