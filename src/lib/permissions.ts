import { Member } from "@/types";

export type Role = Member["role"];
// No separate Owner (2026-10-02, migration 21_simplify-roles): Admin is the top role.
// The person who created the workspace is an Admin who can't be demoted or removed
// and is the only one who controls billing ("creator" in the app, workspaces.created_by).
export const ROLES: Role[] = ["Admin", "Sub Admin", "Member", "Viewer"];

// One line per role for the Team page and the permissions page
export const ROLE_INFO: Record<Role, string> = {
  Admin: "Full control of the workspace: people, boards, clients and what every role below can see and do. Can't be restricted.",
  "Sub Admin": "Team lead (QA, HR, sales lead): manages boards, tasks and clients; pages chosen by the Admin.",
  Member: "Does the work: creates, updates and resolves tasks and bugs.",
  Viewer: "View only: sees the pages the Admin allows, can never change anything.",
};

// Every permission the admin can switch per role. Page permissions hide the page
// (and, in the database, the data behind it); action permissions allow changes.
// Keep this list and DEFAULTS in sync with
// supabase/migrations/17_sub-admin-role/*_update_role_helpers_for_sub_admin.sql (default_permission)
export const PERMISSIONS = [
  { key: "page.dashboard", group: "Pages", label: "Home" },
  { key: "page.projects", group: "Pages", label: "Projects & boards" },
  { key: "page.day", group: "Pages", label: "My Day" },
  { key: "page.inbox", group: "Pages", label: "Inbox" },
  { key: "page.team", group: "Pages", label: "Team" },
  { key: "page.ai", group: "Pages", label: "AI assistant" },
  { key: "page.analytics", group: "Pages", label: "Analytics" },
  { key: "page.clients", group: "Pages", label: "Clients" },
  { key: "page.automations", group: "Pages", label: "Automations" },
  { key: "page.integrations", group: "Pages", label: "Integrations" },
  { key: "page.archive", group: "Pages", label: "Archive & trash" },
  { key: "page.settings", group: "Pages", label: "Settings" },
  { key: "task.create", group: "Tasks", label: "Create tasks" },
  { key: "task.edit", group: "Tasks", label: "Edit tasks (status, fields, subtasks)" },
  { key: "task.assign", group: "Tasks", label: "Assign / reassign tasks" },
  { key: "task.archive", group: "Tasks", label: "Archive / restore tasks" },
  { key: "task.delete", group: "Tasks", label: "Delete tasks" },
  { key: "comment.create", group: "Tasks", label: "Comment" },
  { key: "share.create", group: "Tasks", label: "Create share links" },
  { key: "project.manage", group: "Workspace", label: "Create boards, manage columns" },
  { key: "member.manage", group: "Workspace", label: "Invite members, change roles & permissions" },
  { key: "client.manage", group: "Workspace", label: "Manage clients, budgets, approvals" },
  { key: "automation.manage", group: "Workspace", label: "Manage automations & integrations" },
  { key: "data.export", group: "Workspace", label: "Export data" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];
export type PermissionMatrix = Record<Role, Record<PermissionKey, boolean>>;

const all = (v: boolean) => Object.fromEntries(PERMISSIONS.map((p) => [p.key, v])) as Record<PermissionKey, boolean>;

export const DEFAULT_PERMISSIONS: PermissionMatrix = {
  // Admin always has everything; the matrix can't take it away
  Admin: all(true),
  "Sub Admin": {
    ...all(false),
    "page.dashboard": true,
    "page.projects": true,
    "page.day": true,
    "page.inbox": true,
    "page.team": true,
    "page.ai": true,
    "page.analytics": true,
    "page.clients": true,
    "page.archive": true,
    "task.create": true,
    "task.edit": true,
    "task.assign": true,
    "task.archive": true,
    "task.delete": true,
    "comment.create": true,
    "share.create": true,
    "project.manage": true,
    "client.manage": true,
    "data.export": true,
  },
  Member: {
    ...all(false),
    "page.dashboard": true,
    "page.projects": true,
    "page.day": true,
    "page.inbox": true,
    "page.team": true,
    "page.ai": true,
    "page.analytics": true,
    "page.archive": true,
    "task.create": true,
    "task.edit": true,
    "task.assign": true,
    "task.archive": true,
    "task.delete": true,
    "comment.create": true,
    "share.create": true,
  },
  Viewer: {
    ...all(false),
    "page.dashboard": true,
    "page.projects": true,
    "page.inbox": true,
    "page.team": true,
  },
};

// Route → page permission (used by the sidebar and the page guard)
export const PAGE_PERMISSION: Record<string, PermissionKey> = {
  "/dashboard": "page.dashboard",
  "/projects": "page.projects",
  "/day": "page.day",
  "/inbox": "page.inbox",
  "/team": "page.team",
  "/ai": "page.ai",
  "/analytics": "page.analytics",
  "/clients": "page.clients",
  "/automations": "page.automations",
  "/integrations": "page.integrations",
  "/archive": "page.archive",
  "/settings": "page.settings",
};

export function pagePermissionFor(pathname: string): PermissionKey | null {
  const match = Object.keys(PAGE_PERMISSION).find((p) => pathname === p || pathname.startsWith(p + "/"));
  return match ? PAGE_PERMISSION[match] : null;
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

// Roles someone may hand out (invite or role change): only an Admin grants Admin;
// a Sub Admin / Member given member.manage can hand out the roles below Admin
export function assignableRoles(editor: Role): Role[] {
  if (editor === "Admin") return ["Admin", "Sub Admin", "Member", "Viewer"];
  return ["Sub Admin", "Member", "Viewer"];
}
