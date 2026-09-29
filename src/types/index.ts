export type MemberId = "me" | "ak" | "ba" | "sm";
export type ProjectId = string;
export type Status = string;
export type Priority = "h" | "m" | "l";
export type View = "board" | "list" | "time";
export type Route = "dash" | "projects" | "board" | "day" | "inbox" | "team";

export type Member = {
  id: MemberId;
  name: string;
  initials: string;
  colorClass: "c1" | "c2" | "c3" | "c4";
  role: "Owner" | "Admin" | "Member" | "Viewer";
};

export type Project = {
  id: ProjectId;
  name: string;
  color: string;
  gradient: string;
  description: string;
};

export type Subtask = [title: string, done: 0 | 1];

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
};

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
