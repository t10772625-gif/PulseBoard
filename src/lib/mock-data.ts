import { ActivityEvent, Comment, Member, MemberId, Notification, Priority, Project, ProjectId, Status, Task } from "@/types";

export const MEMBERS: Record<MemberId, Member> = {
  me: { id: "me", name: "Ali Raza", initials: "AR", colorClass: "c1", role: "Owner" },
  ak: { id: "ak", name: "Ayesha Khan", initials: "AK", colorClass: "c2", role: "Admin" },
  ba: { id: "ba", name: "Bilal Ahmed", initials: "BA", colorClass: "c3", role: "Member" },
  sm: { id: "sm", name: "Sara Malik", initials: "SM", colorClass: "c4", role: "Viewer" },
};

export const PROJECTS: Record<ProjectId, Project> = {
  p1: { id: "p1", name: "Website redesign", color: "#12B5A0", gradient: "#3A86FF", description: "New marketing site and landing pages." },
  p2: { id: "p2", name: "Mobile app v2", color: "#6C63FF", gradient: "#C084FC", description: "Rebuild onboarding and notifications." },
  p3: { id: "p3", name: "Q4 launch", color: "#F0A400", gradient: "#FF6B57", description: "Plan, assets and rollout checklist." },
};

export const PROJECT_COLOR_PRESETS: { color: string; gradient: string }[] = [
  { color: "#12B5A0", gradient: "#3A86FF" },
  { color: "#6C63FF", gradient: "#C084FC" },
  { color: "#F0A400", gradient: "#FF6B57" },
  { color: "#E5483A", gradient: "#F0A400" },
  { color: "#3A86FF", gradient: "#6C63FF" },
  { color: "#0C9585", gradient: "#12B5A0" },
];

export const COLUMNS: [Status, string, number][] = [
  ["todo", "To do", 0],
  ["prog", "In progress", 3],
  ["rev", "In review", 2],
  ["done", "Done", 0],
];

export const STATUS_LABEL: Record<Status, string> = Object.fromEntries(COLUMNS.map((c) => [c[0], c[1]])) as Record<Status, string>;

export const PRIORITY_LABEL: Record<Priority, string> = { h: "high", m: "medium", l: "low" };

export const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Design hero section", projectId: "p1", status: "prog", priority: "h", assignee: "me", dueOffset: 5, barStart: -2, lengthDays: 7, labels: ["Design"], subtasks: [["Wireframes", 1], ["Desktop layout", 1], ["Mobile layout", 0], ["Review with team", 0]], description: "Create desktop and mobile layouts for the hero. Include a headline, short text and one main button.", trackedSeconds: 12000, createdDaysAgo: 4 },
  { id: "t2", title: "Write pricing page copy", projectId: "p1", status: "todo", priority: "m", assignee: "ak", dueOffset: 9, barStart: 3, lengthDays: 6, labels: ["Content"], subtasks: [], description: "Three plans, FAQ and comparison table.", trackedSeconds: 0, createdDaysAgo: 1 },
  { id: "t3", title: "Create footer links", projectId: "p1", status: "todo", priority: "l", assignee: "ba", dueOffset: 3, barStart: 0, lengthDays: 3, labels: ["Dev"], subtasks: [], description: "", trackedSeconds: 0, createdDaysAgo: 2 },
  { id: "t4", title: "Fix mobile menu overlap", projectId: "p1", status: "todo", priority: "h", assignee: "me", dueOffset: -1, barStart: -4, lengthDays: 3, labels: ["Bug"], subtasks: [], description: "Menu overlaps the logo below 380px.", trackedSeconds: 0, createdDaysAgo: 16 },
  { id: "t5", title: "Build contact form", projectId: "p1", status: "prog", priority: "m", assignee: "sm", dueOffset: 7, barStart: 1, lengthDays: 6, labels: ["Dev"], subtasks: [["Form fields", 1], ["Validation", 0], ["Email hook", 0]], description: "", trackedSeconds: 3600, createdDaysAgo: 1 },
  { id: "t6", title: "Set up analytics", projectId: "p1", status: "done", priority: "l", assignee: "ba", dueOffset: -3, barStart: -8, lengthDays: 5, labels: ["Dev"], subtasks: [], description: "", trackedSeconds: 7200, createdDaysAgo: 10 },
  { id: "t7", title: "Choose color palette", projectId: "p1", status: "done", priority: "m", assignee: "me", dueOffset: -6, barStart: -10, lengthDays: 4, labels: ["Design"], subtasks: [], description: "", trackedSeconds: 5400, createdDaysAgo: 12 },
  { id: "t8", title: "Onboarding flow wireframes", projectId: "p2", status: "rev", priority: "h", assignee: "ak", dueOffset: 2, barStart: -3, lengthDays: 5, labels: ["Design"], subtasks: [["Step 1", 1], ["Step 2", 1], ["Skip option", 1]], description: "Four-step onboarding with a visible skip option.", trackedSeconds: 9000, createdDaysAgo: 5 },
  { id: "t9", title: "Push notification settings", projectId: "p2", status: "todo", priority: "m", assignee: "me", dueOffset: 13, barStart: 4, lengthDays: 8, labels: ["Dev"], blockedBy: "t8", subtasks: [], description: "Let users choose which alerts they get.", trackedSeconds: 0, createdDaysAgo: 1 },
  { id: "t10", title: "Fix login crash on Android", projectId: "p2", status: "prog", priority: "h", assignee: "ba", dueOffset: 1, barStart: -2, lengthDays: 3, labels: ["Bug"], subtasks: [], description: "Crash occurs after the biometric prompt.", trackedSeconds: 1800, createdDaysAgo: 9 },
  { id: "t11", title: "Biometric prompt QA", projectId: "p2", status: "prog", priority: "m", assignee: "sm", dueOffset: 6, barStart: 0, lengthDays: 6, labels: ["QA"], blockedBy: "t10", subtasks: [], description: "", trackedSeconds: 0, createdDaysAgo: 2 },
  { id: "t12", title: "Launch checklist", projectId: "p3", status: "done", priority: "m", assignee: "me", dueOffset: -2, barStart: -9, lengthDays: 7, labels: ["Ops"], subtasks: [], description: "", trackedSeconds: 14400, createdDaysAgo: 11 },
  { id: "t13", title: "Prepare press kit", projectId: "p3", status: "rev", priority: "l", assignee: "sm", dueOffset: 10, barStart: 2, lengthDays: 8, labels: ["Content"], subtasks: [], description: "Logos, screenshots and boilerplate.", trackedSeconds: 0, createdDaysAgo: 1 },
  { id: "t14", title: "Announcement email", projectId: "p3", status: "prog", priority: "m", assignee: "me", dueOffset: 4, barStart: 0, lengthDays: 4, labels: ["Content"], subtasks: [["Draft", 1], ["Legal review", 0]], description: "", trackedSeconds: 2400, createdDaysAgo: 2 },
  { id: "t15", title: "Rollout plan", projectId: "p3", status: "todo", priority: "h", assignee: "ak", dueOffset: -2, barStart: -6, lengthDays: 4, labels: ["Ops"], subtasks: [], description: "", trackedSeconds: 0, createdDaysAgo: 8 },
];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  t1: [
    { id: "c1", taskId: "t1", parentId: null, author: "ak", text: "Can we try a larger headline? The current one feels small.", at: "27 Sep, 10:20", likedBy: ["me"] },
    { id: "c2", taskId: "t1", parentId: "c1", author: "me", text: "Yes, I will share a new version tomorrow, @Ayesha.", at: "27 Sep, 11:05", likedBy: [] },
  ],
  t8: [{ id: "c3", taskId: "t8", parentId: null, author: "ba", text: "Skip option should be visible on every step.", at: "28 Sep, 09:40", likedBy: [] }],
};

export const INITIAL_ACTIVITY: Record<string, ActivityEvent[]> = Object.fromEntries(
  INITIAL_TASKS.map((t) => [t.id, [{ id: "a-" + t.id, taskId: t.id, actor: "me" as MemberId, message: "Task created by Ali", at: "" }]])
);

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { unread: 1, taskId: "t1", message: "Ayesha commented on Design hero section", when: "10 min ago" },
  { unread: 1, taskId: "t10", message: "Bilal moved Fix login crash on Android to In progress", when: "1 hour ago" },
  { unread: 1, taskId: "t15", message: "Rollout plan is 2 days overdue", when: "3 hours ago" },
  { unread: 0, taskId: "t12", message: "Sara completed Launch checklist", when: "Yesterday" },
];

export const INITIAL_DAY_SCHEDULE: Record<number, string> = { 10: "t1", 14: "t14" };

export const WORKLOAD: Record<MemberId, number[]> = {
  me: [6, 8, 9, 7, 5],
  ak: [5, 6, 6, 7, 4],
  ba: [9, 10, 9, 10, 8],
  sm: [3, 4, 2, 3, 3],
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Anchors the design's relative day offsets ("today" = 29 Sep 2026, month is 0-indexed).
export const TODAY = new Date(2026, 8, 29);

export function dateForOffset(offset: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function offsetForDate(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
