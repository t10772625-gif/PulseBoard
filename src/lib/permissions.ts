import type { Member } from "@/types";

export type Role = Member["role"];
// No separate Owner or creator (user design 2026-10-05, migration 21_simplify-roles):
// Admin = owner = buyer, exactly ONE per workspace. The Admin can't be demoted or removed,
// and only the Admin controls billing. Everything else the Admin can delegate.
export const ROLES: Role[] = ["Admin", "Sub Admin", "Member", "Viewer"];

// One line per role for the Team page and the permissions page
export const ROLE_INFO: Record<Role, string> = {
  Admin: "Full control of the workspace: people, boards, clients and what every role below can see and do. Can't be restricted.",
  "Sub Admin": "Team lead (QA, HR, sales lead): manages boards, tasks and clients; pages chosen by the Admin.",
  Member: "Does the work: creates, updates and resolves tasks and bugs.",
  Viewer: "View only: sees the pages the Admin allows, can never change anything.",
};

// Every permission an Admin can switch per role (user decision 2026-10-05: every page
// and sub-page has its own switch; create, edit and delete are separate everywhere).
//   page.*        which pages the role sees. A sub-page needs its section too
//                 (e.g. /ai/create needs page.ai AND page.ai_create).
//   task.edit / task.move / task.delete reach only your OWN tasks (created by you or
//                 assigned to you) unless the role also has task.edit_all / task.delete_all.
//   file.delete   your own uploads; file.delete_all anyone's.
// Keep this list and DEFAULT_PERMISSIONS in sync with
// supabase/migrations/26_granular-permissions/*_update_default_permissions.sql (default_permission)
// — scripts/permissions-sync-check.mjs compares them.
export const PERMISSIONS = [
  // Pages
  { key: "page.dashboard", group: "Pages", label: "Home" },
  { key: "page.projects", group: "Pages", label: "Projects & boards" },
  { key: "page.day", group: "Pages", label: "My Day" },
  { key: "page.inbox", group: "Pages", label: "Inbox" },
  { key: "page.team", group: "Pages", label: "Team" },
  { key: "page.analytics", group: "Pages", label: "Analytics" },
  { key: "page.clients", group: "Pages", label: "Clients" },
  { key: "page.archive", group: "Pages", label: "Archive & trash" },
  { key: "page.ai", group: "Pages", label: "AI assistant" },
  { key: "page.ai_create", group: "Pages", label: "AI · Create", parent: "page.ai" },
  { key: "page.ai_suggestions", group: "Pages", label: "AI · Suggestions", parent: "page.ai" },
  { key: "page.ai_planning", group: "Pages", label: "AI · Sprint planning", parent: "page.ai" },
  { key: "page.ai_assign", group: "Pages", label: "AI · Smart assign", parent: "page.ai" },
  { key: "page.ai_meetings", group: "Pages", label: "AI · Meetings", parent: "page.ai" },
  { key: "page.automations", group: "Pages", label: "Automations" },
  { key: "page.auto_rules", group: "Pages", label: "Automations · Rules", parent: "page.automations" },
  { key: "page.auto_webhooks", group: "Pages", label: "Automations · Webhooks", parent: "page.automations" },
  { key: "page.auto_notifications", group: "Pages", label: "Automations · Notifications", parent: "page.automations" },
  { key: "page.auto_email_templates", group: "Pages", label: "Automations · Email templates", parent: "page.automations" },
  { key: "page.auto_recurring", group: "Pages", label: "Automations · Recurring", parent: "page.automations" },
  { key: "page.integrations", group: "Pages", label: "Integrations" },
  { key: "page.int_apps", group: "Pages", label: "Integrations · Apps", parent: "page.integrations" },
  { key: "page.int_slack", group: "Pages", label: "Integrations · Slack / Discord", parent: "page.integrations" },
  { key: "page.int_email", group: "Pages", label: "Integrations · Email", parent: "page.integrations" },
  { key: "page.int_github", group: "Pages", label: "Integrations · GitHub", parent: "page.integrations" },
  { key: "page.int_calendar", group: "Pages", label: "Integrations · Calendar", parent: "page.integrations" },
  { key: "page.int_import", group: "Pages", label: "Integrations · Import", parent: "page.integrations" },
  { key: "page.settings", group: "Pages", label: "Workspace settings" },
  { key: "page.set_plan", group: "Pages", label: "Settings · Plan & billing", parent: "page.settings" },
  { key: "page.set_permissions", group: "Pages", label: "Settings · Roles & permissions", parent: "page.settings" },
  { key: "page.set_ai", group: "Pages", label: "Settings · AI", parent: "page.settings" },
  { key: "page.set_custom_fields", group: "Pages", label: "Settings · Custom fields", parent: "page.settings" },
  { key: "page.set_branding", group: "Pages", label: "Settings · Branding", parent: "page.settings" },
  { key: "page.set_audit", group: "Pages", label: "Settings · Audit log", parent: "page.settings" },
  // Tasks
  { key: "task.create", group: "Tasks", label: "Create tasks" },
  { key: "task.edit", group: "Tasks", label: "Edit own tasks" },
  { key: "task.edit_all", group: "Tasks", label: "Edit / move anyone's tasks" },
  { key: "task.move", group: "Tasks", label: "Drag tasks between columns" },
  { key: "task.assign", group: "Tasks", label: "Assign / reassign tasks" },
  { key: "task.archive", group: "Tasks", label: "Archive / restore tasks" },
  { key: "task.delete", group: "Tasks", label: "Delete own tasks" },
  { key: "task.delete_all", group: "Tasks", label: "Delete anyone's tasks" },
  { key: "comment.create", group: "Tasks", label: "Comment" },
  { key: "comment.delete_all", group: "Tasks", label: "Delete anyone's comments" },
  { key: "file.upload", group: "Tasks", label: "Upload files" },
  { key: "file.delete", group: "Tasks", label: "Delete own files" },
  { key: "file.delete_all", group: "Tasks", label: "Delete anyone's files" },
  { key: "share.create", group: "Tasks", label: "Create share links" },
  { key: "share.revoke_all", group: "Tasks", label: "Revoke anyone's share links" },
  // Workspace
  { key: "project.create", group: "Workspace", label: "Create boards" },
  { key: "project.edit", group: "Workspace", label: "Rename / recolour boards" },
  { key: "project.delete", group: "Workspace", label: "Delete boards" },
  { key: "column.create", group: "Workspace", label: "Add columns" },
  { key: "column.edit", group: "Workspace", label: "Rename / reorder columns, set limits" },
  { key: "column.delete", group: "Workspace", label: "Delete columns" },
  { key: "client.create", group: "Workspace", label: "Add clients" },
  { key: "client.edit", group: "Workspace", label: "Edit clients, budgets, approvals" },
  { key: "client.delete", group: "Workspace", label: "Delete clients" },
  { key: "member.invite", group: "Workspace", label: "Invite people" },
  { key: "member.edit", group: "Workspace", label: "Change roles" },
  { key: "member.remove", group: "Workspace", label: "Remove people" },
  { key: "automation.create", group: "Workspace", label: "Create automation rules" },
  { key: "automation.edit", group: "Workspace", label: "Edit / pause automation rules" },
  { key: "automation.delete", group: "Workspace", label: "Delete automation rules" },
  { key: "integration.connect", group: "Workspace", label: "Connect integrations" },
  { key: "integration.edit", group: "Workspace", label: "Change / test integrations" },
  { key: "integration.disconnect", group: "Workspace", label: "Disconnect integrations" },
  { key: "template.create", group: "Workspace", label: "Save templates" },
  { key: "template.delete", group: "Workspace", label: "Delete templates" },
  { key: "field.create", group: "Workspace", label: "Add custom fields" },
  { key: "field.delete", group: "Workspace", label: "Delete custom fields" },
  { key: "data.export", group: "Workspace", label: "Export data" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];
export type PermissionMatrix = Record<Role, Record<PermissionKey, boolean>>;

const all = (v: boolean) => Object.fromEntries(PERMISSIONS.map((p) => [p.key, v])) as Record<PermissionKey, boolean>;
const on = (...keys: PermissionKey[]) => Object.fromEntries(keys.map((k) => [k, true])) as Partial<Record<PermissionKey, boolean>>;

// Sub-pages are on by default; whether a role sees them is decided by the section switch
const SUB_PAGES: PermissionKey[] = [
  "page.ai_create", "page.ai_suggestions", "page.ai_planning", "page.ai_assign", "page.ai_meetings",
  "page.auto_rules", "page.auto_webhooks", "page.auto_notifications", "page.auto_email_templates", "page.auto_recurring",
  "page.int_apps", "page.int_slack", "page.int_email", "page.int_github", "page.int_calendar", "page.int_import",
  "page.set_custom_fields", "page.set_audit",
];

export const DEFAULT_PERMISSIONS: PermissionMatrix = {
  // Admin always has everything; the matrix can't take it away
  Admin: all(true),
  "Sub Admin": {
    ...all(false),
    ...on(...SUB_PAGES),
    ...on("page.dashboard", "page.projects", "page.day", "page.inbox", "page.team", "page.ai", "page.analytics", "page.clients", "page.archive"),
    ...on("task.create", "task.edit", "task.edit_all", "task.move", "task.assign", "task.archive", "task.delete", "task.delete_all"),
    ...on("comment.create", "comment.delete_all", "file.upload", "file.delete", "file.delete_all", "share.create", "share.revoke_all"),
    ...on("project.create", "project.edit", "project.delete", "column.create", "column.edit", "column.delete"),
    ...on("client.create", "client.edit", "client.delete", "template.create", "template.delete", "field.create", "field.delete", "data.export"),
  },
  Member: {
    ...all(false),
    ...on(...SUB_PAGES),
    ...on("page.dashboard", "page.projects", "page.day", "page.inbox", "page.team", "page.ai", "page.analytics", "page.archive"),
    // Own tasks only; deleting is off until an Admin turns it on (user decision 2026-10-05)
    ...on("task.create", "task.edit", "task.move", "task.assign", "task.archive"),
    ...on("comment.create", "file.upload", "file.delete", "share.create", "template.create"),
  },
  Viewer: {
    ...all(false),
    ...on(...SUB_PAGES),
    ...on("page.dashboard", "page.projects", "page.inbox", "page.team"),
  },
};

// Route → page permissions, most specific first. A sub-page needs every key listed.
export const PAGE_PERMISSION: [string, PermissionKey[]][] = [
  ["/ai/create", ["page.ai", "page.ai_create"]],
  ["/ai/suggestions", ["page.ai", "page.ai_suggestions"]],
  ["/ai/planning", ["page.ai", "page.ai_planning"]],
  ["/ai/assign", ["page.ai", "page.ai_assign"]],
  ["/ai/meetings", ["page.ai", "page.ai_meetings"]],
  ["/automations/rules", ["page.automations", "page.auto_rules"]],
  ["/automations/webhooks", ["page.automations", "page.auto_webhooks"]],
  ["/automations/notifications", ["page.automations", "page.auto_notifications"]],
  ["/automations/email-templates", ["page.automations", "page.auto_email_templates"]],
  ["/automations/recurring", ["page.automations", "page.auto_recurring"]],
  ["/integrations/apps", ["page.integrations", "page.int_apps"]],
  ["/integrations/slack", ["page.integrations", "page.int_slack"]],
  ["/integrations/email", ["page.integrations", "page.int_email"]],
  ["/integrations/github", ["page.integrations", "page.int_github"]],
  ["/integrations/calendar", ["page.integrations", "page.int_calendar"]],
  ["/integrations/import", ["page.integrations", "page.int_import"]],
  ["/settings/plan", ["page.settings", "page.set_plan"]],
  ["/settings/permissions", ["page.settings", "page.set_permissions"]],
  ["/settings/ai", ["page.settings", "page.set_ai"]],
  ["/settings/custom-fields", ["page.settings", "page.set_custom_fields"]],
  ["/settings/branding", ["page.settings", "page.set_branding"]],
  ["/settings/audit", ["page.settings", "page.set_audit"]],
  ["/dashboard", ["page.dashboard"]],
  ["/projects", ["page.projects"]],
  ["/day", ["page.day"]],
  ["/inbox", ["page.inbox"]],
  ["/team", ["page.team"]],
  ["/ai", ["page.ai"]],
  ["/analytics", ["page.analytics"]],
  ["/clients", ["page.clients"]],
  ["/automations", ["page.automations"]],
  ["/integrations", ["page.integrations"]],
  ["/archive", ["page.archive"]],
  ["/settings", ["page.settings"]],
];

// Your own account pages: every role may open them (2FA, language, export / delete
// your own account), even without the workspace "Settings" page permission.
// Each page still checks its own actions (e.g. export needs data.export).
export const PERSONAL_PAGES = ["/settings/security", "/settings/language", "/settings/data"];

// Every page permission a path needs ([] = open to every member)
export function pagePermissionsFor(pathname: string): PermissionKey[] {
  if (PERSONAL_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return [];
  const match = PAGE_PERMISSION.find(([p]) => pathname === p || pathname.startsWith(p + "/"));
  return match ? match[1] : [];
}
// The most specific one (shown in the "No access" message)
export function pagePermissionFor(pathname: string): PermissionKey | null {
  const keys = pagePermissionsFor(pathname);
  return keys.length ? keys[keys.length - 1] : null;
}

// Who may change which rows of the matrix: an Admin edits Sub Admin, Member and
// Viewer. The Admin row is always full access and can't be edited. Mirrors the
// role_permissions policy in migration 21_simplify-roles.
export function canEditRole(editor: Role, target: Role): boolean {
  return editor === "Admin" && target !== "Admin";
}

// Viewer is view-only: only page permissions can ever be on (also enforced in has_permission)
export const isPagePermission = (key: PermissionKey) => key.startsWith("page.");
export const lockedForRole = (role: Role, key: PermissionKey) => role === "Viewer" && !isPagePermission(key);

// Roles someone may hand out (invite or role change). There is exactly one Admin per
// workspace, so Admin is never handed out (the database refuses it too).
export function assignableRoles(editor: Role, canGrantAdmin: boolean): Role[] {
  void editor;
  void canGrantAdmin;
  return ["Sub Admin", "Member", "Viewer"];
}

// Own-only task actions: the base permission plus, for someone else's task, the
// "anyone's" permission. Same rule as public.task_permitted() in migration 26.
export type TaskAction = "edit" | "move" | "delete";
export const TASK_ACTION_KEYS: Record<TaskAction, { base: PermissionKey; all: PermissionKey }> = {
  edit: { base: "task.edit", all: "task.edit_all" },
  move: { base: "task.move", all: "task.edit_all" },
  delete: { base: "task.delete", all: "task.delete_all" },
};
// "Own" = created by you or assigned to you. An unassigned task is nobody's
// (`unassigned`), even though the app shows it under the signed-in user.
export const isOwnTask = (task: { createdBy?: string; assignee: string; unassigned?: boolean }) =>
  task.createdBy === "me" || (task.assignee === "me" && !task.unassigned);
// "Mine" in lists (My Day, Home, "Only mine"): assigned to me, not merely unassigned
export const isMine = (task: { assignee: string; unassigned?: boolean }) => task.assignee === "me" && !task.unassigned;
