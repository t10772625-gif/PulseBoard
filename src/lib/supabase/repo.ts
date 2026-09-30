// Database access for the store (phase B2). Maps between DB rows and the app's
// types. The signed-in user is always "me" inside the app; other members keep
// their auth user id. Every call runs as the user, so RLS decides what's allowed.
import type { SupabaseClient } from "@supabase/supabase-js";
import { Attachment, AutomationRule, Client, Comment, Member, MemberId, Notification, Plan, Project, ShareLink, Subtask, Task } from "@/types";
import { TODAY } from "../mock-data";
import { DEFAULT_PERMISSIONS, type PermissionKey, type PermissionMatrix, type Role } from "../permissions";

export type DbCtx = { sb: SupabaseClient; ws: string; uid: string };
export type ColumnRow = [string, string, number];

const DAY = 86400000;
const COLORS: Member["colorClass"][] = ["c1", "c2", "c3", "c4"];

export const toDbUser = (ctx: DbCtx, id: MemberId | null | undefined) => (!id ? null : id === "me" ? ctx.uid : id);
const fromDbUser = (ctx: DbCtx, id: string | null) => (!id ? "me" : id === ctx.uid ? "me" : id);

function offsetToDate(off: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + off);
  return d.toISOString().slice(0, 10);
}
const dateToOffset = (d: string | null) => (d ? Math.round((new Date(d + "T00:00:00").getTime() - TODAY.getTime()) / DAY) : 7);
const daysAgo = (ts: string | null) => (ts ? Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / DAY)) : undefined);
const agoToTs = (n: number | undefined) => (n === undefined ? null : new Date(Date.now() - n * DAY).toISOString());

type TaskRow = {
  id: string;
  project_id: string;
  status: string;
  title: string;
  description: string;
  priority: "h" | "m" | "l";
  assignee_id: string | null;
  due_date: string | null;
  labels: string[];
  subtasks: Subtask[];
  checklist: Subtask[];
  custom_fields: Record<string, string>;
  recurrence: Task["recurrence"];
  estimate_hours: number | null;
  energy: Task["energy"] | null;
  billable: boolean;
  module: string | null;
  approval: Task["approval"];
  blocked_by: string | null;
  tracked_seconds: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
};

export function rowToTask(ctx: DbCtx, r: TaskRow): Task {
  const due = dateToOffset(r.due_date);
  const created = daysAgo(r.created_at) ?? 0;
  return {
    id: r.id,
    title: r.title,
    projectId: r.project_id,
    status: r.status,
    priority: r.priority,
    assignee: fromDbUser(ctx, r.assignee_id),
    dueOffset: due,
    barStart: -Math.min(created, 10),
    lengthDays: Math.max(1, due + Math.min(created, 10)),
    labels: r.labels ?? [],
    subtasks: r.subtasks ?? [],
    description: r.description ?? "",
    blockedBy: r.blocked_by ?? undefined,
    trackedSeconds: r.tracked_seconds ?? 0,
    createdDaysAgo: created,
    checklist: r.checklist ?? [],
    customFields: r.custom_fields ?? {},
    recurrence: r.recurrence ?? "none",
    estimateHours: r.estimate_hours ?? undefined,
    energy: r.energy ?? undefined,
    billable: r.billable,
    module: r.module ?? undefined,
    approval: r.approval ?? "none",
    startedDaysAgo: daysAgo(r.started_at),
    completedDaysAgo: daysAgo(r.completed_at),
  };
}

// Only the fields present in the patch are written
export function taskPatchToRow(ctx: DbCtx, p: Partial<Task>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.title !== undefined) row.title = p.title;
  if (p.projectId !== undefined) row.project_id = p.projectId;
  if (p.status !== undefined) row.status = p.status;
  if (p.priority !== undefined) row.priority = p.priority;
  if (p.assignee !== undefined) row.assignee_id = toDbUser(ctx, p.assignee);
  if (p.dueOffset !== undefined) row.due_date = offsetToDate(p.dueOffset);
  if (p.labels !== undefined) row.labels = p.labels;
  if (p.subtasks !== undefined) row.subtasks = p.subtasks;
  if (p.description !== undefined) row.description = p.description;
  if ("blockedBy" in p) row.blocked_by = p.blockedBy ?? null;
  if (p.trackedSeconds !== undefined) row.tracked_seconds = Math.round(p.trackedSeconds);
  if (p.checklist !== undefined) row.checklist = p.checklist;
  if (p.customFields !== undefined) row.custom_fields = p.customFields;
  if (p.recurrence !== undefined) row.recurrence = p.recurrence;
  if ("estimateHours" in p) row.estimate_hours = p.estimateHours ?? null;
  if ("energy" in p) row.energy = p.energy ?? null;
  if (p.billable !== undefined) row.billable = p.billable;
  if (p.module !== undefined) row.module = p.module;
  if (p.approval !== undefined) row.approval = p.approval;
  if ("startedDaysAgo" in p) row.started_at = agoToTs(p.startedDaysAgo);
  if ("completedDaysAgo" in p) row.completed_at = agoToTs(p.completedDaysAgo);
  return row;
}

export function initials(name: string, email: string) {
  const src = name.trim() || email;
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export type Loaded = {
  ctx: DbCtx;
  workspaceName: string;
  plan: Plan;
  meName: string;
  meEmail: string;
  members: Record<MemberId, Member>;
  capacity: Record<MemberId, number>;
  projects: Record<string, Project>;
  columns: Record<string, ColumnRow[]>;
  tasks: Task[];
  archived: Task[];
  comments: Record<string, Comment[]>;
  notifications: (Notification & { id: string })[];
  clients: Client[];
  rules: AutomationRule[];
  shareLinks: ShareLink[];
  permissions: PermissionMatrix;
  attachments: Record<string, Attachment[]>;
};

const fmtWhen = (ts: string) => new Date(ts).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// Loads the user's first workspace and everything the app shows.
export async function loadWorkspace(sb: SupabaseClient): Promise<Loaded | null> {
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;

  const mine = check(await sb.from("workspace_members").select("workspace_id, workspaces(name, plan)").eq("user_id", uid).limit(1));
  const first = mine?.[0] as unknown as { workspace_id: string; workspaces: { name: string; plan: Plan } } | undefined;
  if (!first) throw new Error("No workspace found for this account.");
  const ctx: DbCtx = { sb, ws: first.workspace_id, uid };

  const memberRows = check(await sb.from("workspace_members").select("user_id, role, capacity").eq("workspace_id", ctx.ws)) as { user_id: string; role: Member["role"]; capacity: number }[];
  const profileRows = check(await sb.from("profiles").select("id, full_name, email").in("id", memberRows.map((m) => m.user_id))) as { id: string; full_name: string; email: string }[];
  const members: Record<MemberId, Member> = {};
  const capacity: Record<MemberId, number> = {};
  memberRows.forEach((m, i) => {
    const p = profileRows.find((x) => x.id === m.user_id);
    const id = fromDbUser(ctx, m.user_id);
    const name = p?.full_name || p?.email?.split("@")[0] || "Member";
    members[id] = { id, name, initials: initials(p?.full_name ?? "", p?.email ?? "?"), colorClass: COLORS[i % 4], role: m.role };
    capacity[id] = m.capacity;
  });

  const projectRows = check(await sb.from("projects").select("*").eq("workspace_id", ctx.ws).order("created_at")) as {
    id: string;
    name: string;
    description: string;
    color: string;
    gradient: string;
  }[];
  const projects: Record<string, Project> = Object.fromEntries(projectRows.map((p) => [p.id, { id: p.id, name: p.name, description: p.description, color: p.color, gradient: p.gradient }]));

  const colRows = projectRows.length
    ? (check(await sb.from("board_columns").select("project_id, status_key, label, wip_limit, position").in("project_id", projectRows.map((p) => p.id)).order("position")) as {
        project_id: string;
        status_key: string;
        label: string;
        wip_limit: number;
      }[])
    : [];
  const columns: Record<string, ColumnRow[]> = {};
  colRows.forEach((c) => (columns[c.project_id] ||= []).push([c.status_key, c.label, c.wip_limit]));

  const taskRows = check(await sb.from("tasks").select("*").eq("workspace_id", ctx.ws).is("deleted_at", null).order("created_at")) as TaskRow[];
  const tasks = taskRows.filter((r) => !r.archived_at).map((r) => rowToTask(ctx, r));
  const archived = taskRows.filter((r) => r.archived_at).map((r) => rowToTask(ctx, r));

  const commentRows = check(await sb.from("comments").select("*").eq("workspace_id", ctx.ws).order("created_at")) as {
    id: string;
    task_id: string;
    parent_id: string | null;
    author_id: string | null;
    body: string;
    liked_by: string[];
    created_at: string;
  }[];
  const comments: Record<string, Comment[]> = {};
  commentRows.forEach((c) =>
    (comments[c.task_id] ||= []).push({
      id: c.id,
      taskId: c.task_id,
      parentId: c.parent_id,
      author: fromDbUser(ctx, c.author_id),
      text: c.body,
      at: fmtWhen(c.created_at),
      likedBy: (c.liked_by ?? []).map((u) => fromDbUser(ctx, u)),
    })
  );

  const notifRows = check(await sb.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100)) as {
    id: string;
    task_id: string | null;
    message: string;
    read_at: string | null;
    created_at: string;
  }[];
  const notifications = notifRows.map((n) => ({ id: n.id, taskId: n.task_id ?? "", message: n.message, unread: (n.read_at ? 0 : 1) as 0 | 1, when: fmtWhen(n.created_at) }));

  const clientRows = check(await sb.from("clients").select("*").eq("workspace_id", ctx.ws)) as {
    id: string;
    name: string;
    email: string;
    project_id: string | null;
    hourly_rate: number;
    budget: number;
    report_day: Client["reportDay"];
  }[];
  const clients: Client[] = clientRows.map((c) => ({ id: c.id, name: c.name, email: c.email, projectId: c.project_id ?? "", hourlyRate: Number(c.hourly_rate), budget: Number(c.budget), reportDay: c.report_day }));

  const ruleRows = check(await sb.from("automation_rules").select("*").eq("workspace_id", ctx.ws).order("created_at")) as (AutomationRule & { param: string | null })[];
  const rules: AutomationRule[] = ruleRows.map((r) => ({ id: r.id, name: r.name, trigger: r.trigger, action: r.action, param: r.param ?? undefined, active: r.active, runs: r.runs }));

  const linkRows = check(await sb.from("share_links").select("token, kind, target_id, created_at, revoked_at").eq("workspace_id", ctx.ws)) as {
    token: string;
    kind: ShareLink["kind"];
    target_id: string;
    created_at: string;
    revoked_at: string | null;
  }[];
  const shareLinks: ShareLink[] = linkRows.map((l) => ({ token: l.token, kind: l.kind, targetId: l.target_id, createdAt: new Date(l.created_at).getTime(), revoked: !!l.revoked_at }));

  // Role permission overrides on top of the defaults
  const permRows = check(await sb.from("role_permissions").select("role, permission, allowed").eq("workspace_id", ctx.ws)) as { role: Role; permission: PermissionKey; allowed: boolean }[];
  const permissions: PermissionMatrix = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
  permRows.forEach((p) => {
    if (p.role !== "Owner" && permissions[p.role]) permissions[p.role][p.permission] = p.allowed;
  });

  // Attachments: private bucket, so each file gets a short-lived signed URL
  const fileRows = check(await sb.from("attachments").select("id, task_id, storage_path, file_name, mime_type").eq("workspace_id", ctx.ws)) as {
    id: string;
    task_id: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
  }[];
  const attachments: Record<string, Attachment[]> = {};
  if (fileRows.length) {
    const { data: signed } = await sb.storage.from("task-files").createSignedUrls(fileRows.map((f) => f.storage_path), 60 * 60);
    fileRows.forEach((f, i) => {
      const url = signed?.[i]?.signedUrl;
      if (url) (attachments[f.task_id] ||= []).push({ id: f.id, taskId: f.task_id, url, name: f.file_name, kind: f.mime_type.startsWith("video/") ? "video" : "image" });
    });
  }

  return {
    ctx,
    workspaceName: first.workspaces.name,
    plan: first.workspaces.plan,
    meName: members.me?.name ?? "You",
    meEmail: auth.user?.email ?? "",
    members,
    capacity,
    projects,
    columns,
    tasks,
    archived,
    comments,
    notifications,
    clients,
    rules,
    shareLinks,
    permissions,
    attachments,
  };
}

// ---------- Writes ----------
async function run(p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) throw new Error(error.message);
}

export function repo(ctx: DbCtx) {
  const { sb, ws, uid } = ctx;
  return {
    insertProject: (p: Project, cols: ColumnRow[]) =>
      run(sb.from("projects").insert({ id: p.id, workspace_id: ws, name: p.name, description: p.description, color: p.color, gradient: p.gradient })).then(() =>
        run(sb.from("board_columns").insert(cols.map(([key, label, limit], i) => ({ project_id: p.id, status_key: key, label, wip_limit: limit, position: i }))))
      ),
    replaceColumns: async (projectId: string, cols: ColumnRow[]) => {
      await run(sb.from("board_columns").delete().eq("project_id", projectId));
      await run(sb.from("board_columns").insert(cols.map(([key, label, limit], i) => ({ project_id: projectId, status_key: key, label, wip_limit: limit, position: i }))));
    },
    insertTask: (t: Task) =>
      run(sb.from("tasks").insert({ id: t.id, workspace_id: ws, ...taskPatchToRow(ctx, t), created_at: agoToTs(t.createdDaysAgo) ?? new Date().toISOString() })),
    updateTasks: (ids: string[], patch: Partial<Task>) => {
      const row = taskPatchToRow(ctx, patch);
      return Object.keys(row).length ? run(sb.from("tasks").update(row).in("id", ids)) : Promise.resolve();
    },
    softDelete: (ids: string[]) => run(sb.from("tasks").update({ deleted_at: new Date().toISOString() }).in("id", ids)),
    restore: (ids: string[]) => run(sb.from("tasks").update({ deleted_at: null }).in("id", ids)),
    hardDelete: (ids: string[]) => (ids.length ? run(sb.from("tasks").delete().in("id", ids)) : Promise.resolve()),
    setArchived: (ids: string[], archived: boolean) => run(sb.from("tasks").update({ archived_at: archived ? new Date().toISOString() : null }).in("id", ids)),
    insertComment: (c: Comment) =>
      run(sb.from("comments").insert({ id: c.id, workspace_id: ws, task_id: c.taskId, parent_id: c.parentId, author_id: uid, body: c.text })),
    setCommentLikes: (id: string, likedBy: MemberId[]) => run(sb.from("comments").update({ liked_by: likedBy.map((m) => toDbUser(ctx, m)) }).eq("id", id)),
    logEvent: (taskId: string | null, type: string, message: string, fromStatus?: string, toStatus?: string) =>
      run(sb.from("task_events").insert({ workspace_id: ws, task_id: taskId, actor_id: uid, type, message, from_status: fromStatus ?? null, to_status: toStatus ?? null })),
    notifyUser: (userId: MemberId, taskId: string | null, message: string) =>
      run(sb.from("notifications").insert({ workspace_id: ws, user_id: toDbUser(ctx, userId), task_id: taskId, message })),
    markNotificationsRead: (ids: string[]) => (ids.length ? run(sb.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids)) : Promise.resolve()),
    setMemberRole: (id: MemberId, role: Member["role"]) => run(sb.from("workspace_members").update({ role }).eq("workspace_id", ws).eq("user_id", toDbUser(ctx, id))),
    setCapacity: (id: MemberId, capacity: number) => run(sb.from("workspace_members").update({ capacity }).eq("workspace_id", ws).eq("user_id", toDbUser(ctx, id))),
    insertClient: (c: Client) =>
      run(sb.from("clients").insert({ id: c.id, workspace_id: ws, name: c.name, email: c.email, project_id: c.projectId || null, hourly_rate: c.hourlyRate, budget: c.budget, report_day: c.reportDay })),
    updateClient: (id: string, p: Partial<Client>) => {
      const row: Record<string, unknown> = {};
      if (p.name !== undefined) row.name = p.name;
      if (p.email !== undefined) row.email = p.email;
      if (p.hourlyRate !== undefined) row.hourly_rate = p.hourlyRate;
      if (p.budget !== undefined) row.budget = p.budget;
      if (p.reportDay !== undefined) row.report_day = p.reportDay;
      return run(sb.from("clients").update(row).eq("id", id));
    },
    insertRule: (r: AutomationRule) =>
      run(sb.from("automation_rules").insert({ id: r.id, workspace_id: ws, name: r.name, trigger: r.trigger, action: r.action, param: r.param ?? null, active: r.active })),
    updateRule: (id: string, p: Partial<AutomationRule>) => run(sb.from("automation_rules").update(p).eq("id", id)),
    deleteRule: (id: string) => run(sb.from("automation_rules").delete().eq("id", id)),
    // Upload to the private bucket, then record size for the plan quota. If the
    // quota trigger rejects the row, the uploaded object is removed again.
    uploadAttachment: async (id: string, taskId: string, file: File) => {
      const path = `${ws}/${taskId}/${id}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await sb.storage.from("task-files").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw new Error(up.error.message);
      const ins = await sb.from("attachments").insert({ id, workspace_id: ws, task_id: taskId, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: uid });
      if (ins.error) {
        await sb.storage.from("task-files").remove([path]);
        throw new Error(ins.error.message);
      }
    },
    deleteAttachment: async (id: string) => {
      const { data } = await sb.from("attachments").select("storage_path").eq("id", id).maybeSingle();
      if (!data) return;
      await run(sb.from("attachments").delete().eq("id", id));
      await sb.storage.from("task-files").remove([(data as { storage_path: string }).storage_path]);
    },
    storageUsage: async () => {
      const [used, limit] = await Promise.all([sb.rpc("storage_used_bytes", { ws }), sb.rpc("storage_limit_bytes", { ws })]);
      return { used: Number(used.data ?? 0), limit: Number(limit.data ?? 0) };
    },
    // Email a teammate through the server route (B3). Fails quietly if email isn't configured.
    emailUser: async (userId: MemberId, subject: string, text: string, taskUrl?: string) => {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ws, toUserId: toDbUser(ctx, userId), subject, text, taskUrl }),
      });
      if (res.status === 503) return; // email not set up yet: in-app notification still works
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Email failed");
    },
    setPermission: (role: Role, permission: PermissionKey, allowed: boolean) =>
      run(sb.from("role_permissions").upsert({ workspace_id: ws, role, permission, allowed }, { onConflict: "workspace_id,role,permission" })),
    resetPermissions: (role: Role) => run(sb.from("role_permissions").delete().eq("workspace_id", ws).eq("role", role)),
    // Token is generated in the browser (crypto.getRandomValues) so the link can be copied immediately
    insertShareLink: (token: string, kind: ShareLink["kind"], targetId: string) =>
      run(sb.from("share_links").insert({ token, workspace_id: ws, kind, target_id: targetId, created_by: uid })),
    revokeShareLink: (token: string) => run(sb.from("share_links").update({ revoked_at: new Date().toISOString() }).eq("token", token)),
    // Pre-approved emails: open invites only (accepted/revoked ones stay in the table as the audit record)
    listInvites: async (): Promise<Invite[]> => {
      const rows = check(
        await sb.from("workspace_invites").select("id, email, role, expires_at").eq("workspace_id", ws).is("accepted_at", null).is("revoked_at", null).order("created_at", { ascending: false })
      ) as { id: string; email: string; role: Member["role"]; expires_at: string }[];
      return rows.map((r) => ({ id: r.id, email: r.email, role: r.role, expiresAt: r.expires_at }));
    },
    insertInvite: (email: string, role: Member["role"]) => run(sb.from("workspace_invites").insert({ workspace_id: ws, email, role })),
    // Own profile: only the display name is writable (column grant + RLS "update self")
    updateMyName: (name: string) => run(sb.from("profiles").update({ full_name: name }).eq("id", uid)),
    revokeInvite: (id: string) => run(sb.from("workspace_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id)),
  };
}

export type Invite = { id: string; email: string; role: Member["role"]; expiresAt: string };

export type Repo = ReturnType<typeof repo>;
