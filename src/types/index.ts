// "me" is always the signed-in user; other members use their id ("ak" etc. in
// demo data, the auth user id with Supabase).
export type MemberId = string;
export type ProjectId = string;
export type Status = string;
export type Priority = "h" | "m" | "l";
export type View = "board" | "list" | "time" | "calendar" | "workload" | "matrix";
export type Route = "dash" | "projects" | "board" | "day" | "inbox" | "team";

export type Member = {
  id: MemberId;
  name: string;
  initials: string;
  colorClass: "c1" | "c2" | "c3" | "c4";
  role: "Owner" | "Admin" | "Sub Admin" | "Member" | "Viewer";
};

export type Project = {
  id: ProjectId;
  name: string;
  color: string;
  gradient: string;
  description: string;
};

export type Subtask = [title: string, done: 0 | 1];

export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type Energy = "high" | "low";

export type Task = {
  id: string;
  title: string;
  projectId: ProjectId;
  status: Status;
  priority: Priority;
  assignee: MemberId;
  dueOffset: number;
  barStart: number;
  lengthDays: number;
  labels: string[];
  subtasks: Subtask[];
  description: string;
  blockedBy?: string;
  trackedSeconds: number;
  createdDaysAgo: number;
  // Added fields — all optional so existing mock tasks stay valid
  checklist?: Subtask[];
  customFields?: Record<string, string>;
  recurrence?: Recurrence;
  estimateHours?: number;
  energy?: Energy;
  billable?: boolean;
  module?: string;
  approval?: "none" | "requested" | "approved" | "rejected";
  startedDaysAgo?: number;
  completedDaysAgo?: number;
};

export type Plan = "basic" | "pro" | "enterprise";

export type CustomFieldDef = { id: string; name: string; type: "text" | "number" | "select"; options?: string[] };

export type SavedFilter = { id: string; name: string; query: string };

export type TaskTemplate = { id: string; name: string; tasks: { title: string; status: Status; priority: Priority; labels: string[]; subtasks: string[] }[] };

export type AutomationRule = {
  id: string;
  name: string;
  trigger: "status_done" | "priority_high" | "assigned" | "overdue" | "created";
  action: "notify_owner" | "assign_me" | "set_high" | "add_label" | "webhook";
  param?: string;
  active: boolean;
  runs: number;
};

export type AuditEvent = { id: string; at: number; actor: MemberId; message: string; taskId?: string };

export type HistoryItem = {
  title: string;
  module: string;
  assignee: MemberId;
  createdDaysAgo: number;
  startedDaysAgo: number;
  completedDaysAgo: number;
  estimateHours: number;
  actualHours: number;
  priority: Priority;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  projectId: ProjectId;
  hourlyRate: number;
  budget: number;
  reportDay: "Fri" | "Mon" | "none";
};

export type ShareLink = { token: string; kind: "task" | "board"; targetId: string; createdAt: number; revoked: boolean };

export type Branding = { name: string; color: string; domain: string; domainStatus: "none" | "pending" | "verified" };

export type WebhookDelivery = { id: string; at: number; url: string; event: string; ok: boolean };

export type Comment = {
  id: string;
  taskId: string;
  parentId: string | null;
  author: MemberId;
  text: string;
  at: string;
  likedBy: MemberId[];
};

export type ActivityEvent = {
  id: string;
  taskId: string;
  actor: MemberId;
  message: string;
  at: string;
};

export type Notification = { unread: 0 | 1; taskId: string; message: string; when: string };

export type HealthFactor = { label: string; points: number };

export type Health = {
  score: number;
  overdue: number;
  blocked: number;
  bugs: number;
  color: string;
  label: string;
  critical: boolean;
  done: number;
  total: number;
  breakdown: HealthFactor[];
};

export type Attachment = {
  id: string;
  taskId: string;
  url: string;
  kind: "image" | "video";
  name: string;
};

export type TrackingSession = {
  taskId: string;
  status: "running" | "paused";
  startedAt: number | null;
  accumulated: number;
};

export type BoardFilters = { mine: boolean; high: boolean; blk: boolean; assignees: MemberId[] };

export type NewTaskDefaults = { projectId: ProjectId; status: Status };
