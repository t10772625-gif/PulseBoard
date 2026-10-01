import { activeFormatters, tr } from "@/i18n";
import {
  ActivityEvent,
  AutomationRule,
  Client,
  Comment,
  HistoryItem,
  Member,
  MemberId,
  Notification,
  Priority,
  Project,
  ProjectId,
  Status,
  Task,
  TaskTemplate,
} from "@/types";

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

// Labels read the language on screen each time they're used (getters), so every
// existing STATUS_LABEL[s] / PRIORITY_LABEL[p] call site is translated as-is.
export const STATUS_LABEL: Record<Status, string> = {
  get todo() {
    return tr("status.todo");
  },
  get prog() {
    return tr("status.prog");
  },
  get rev() {
    return tr("status.rev");
  },
  get done() {
    return tr("status.done");
  },
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  get h() {
    return tr("priority.h");
  },
  get m() {
    return tr("priority.m");
  },
  get l() {
    return tr("priority.l");
  },
};

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

// Anchor for relative day offsets (due dates are stored as "days from today"): today at midnight
export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

// Short date in the language on screen (e.g. "3 Oct" / "3 اکتوبر"). Display only:
// never parse this string back (offsetForDate takes ISO input values).
export function dateForOffset(offset: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return activeFormatters().date(d, { day: "numeric", month: "short" });
}

export function offsetForDate(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

// Open-task capacity per member, used by workload balancing and capacity planning
export const DEFAULT_CAPACITY: Record<MemberId, number> = { me: 5, ak: 4, ba: 4, sm: 4 };

// Completed work from past sprints. Powers Smart Matching (who has done this
// module before), analytics (cycle time, throughput, velocity) and estimates.
const H = (
  title: string,
  module: string,
  assignee: MemberId,
  completedDaysAgo: number,
  cycleDays: number,
  estimateHours: number,
  actualHours: number,
  priority: Priority = "m"
): HistoryItem => ({
  title,
  module,
  assignee,
  completedDaysAgo,
  startedDaysAgo: completedDaysAgo + cycleDays,
  createdDaysAgo: completedDaysAgo + cycleDays + 2,
  estimateHours,
  actualHours,
  priority,
});

export const HISTORY: HistoryItem[] = [
  H("Fix checkout rounding", "Payment", "ba", 3, 2, 4, 5, "h"),
  H("Stripe webhook retries", "Payment", "ba", 6, 3, 6, 8, "h"),
  H("Refund flow timeout", "Payment", "ba", 10, 2, 4, 4, "h"),
  H("Invoice PDF layout", "Payment", "ak", 12, 3, 5, 6),
  H("Payment gateway timeout", "Payment", "ba", 17, 1, 3, 2, "h"),
  H("Currency formatter", "Payment", "me", 22, 2, 3, 3, "l"),
  H("Login rate limiting", "Auth", "me", 2, 2, 5, 6, "h"),
  H("Password reset email", "Auth", "me", 8, 1, 2, 2),
  H("OAuth callback bug", "Auth", "me", 13, 2, 4, 7, "h"),
  H("Session expiry banner", "Auth", "ak", 19, 2, 3, 3),
  H("Biometric login spike", "Auth", "ba", 24, 3, 6, 9, "h"),
  H("Hero illustration", "UI", "ak", 1, 3, 6, 5),
  H("Button focus states", "UI", "ak", 5, 1, 2, 2, "l"),
  H("Dark mode tokens", "UI", "ak", 9, 4, 8, 10),
  H("Mobile nav overlap", "UI", "sm", 11, 2, 3, 4, "h"),
  H("Empty states", "UI", "ak", 16, 2, 4, 3, "l"),
  H("Icon set cleanup", "UI", "sm", 21, 1, 2, 2, "l"),
  H("Push token refresh", "Mobile", "ba", 4, 2, 5, 6),
  H("Android crash on resume", "Mobile", "ba", 7, 3, 6, 10, "h"),
  H("iOS deep links", "Mobile", "ba", 14, 2, 4, 4),
  H("Offline banner", "Mobile", "sm", 20, 2, 3, 3, "l"),
  H("Launch press release", "Content", "sm", 2, 3, 6, 5),
  H("Pricing FAQ", "Content", "ak", 7, 2, 3, 4),
  H("Blog post: v2", "Content", "sm", 15, 4, 6, 7, "l"),
  H("Release notes", "Content", "sm", 23, 1, 2, 2, "l"),
  H("CI cache setup", "DevOps", "me", 5, 2, 4, 3),
  H("Staging deploy script", "DevOps", "me", 11, 3, 6, 8),
  H("Log retention policy", "DevOps", "me", 18, 1, 2, 2, "l"),
  H("QA regression pass", "QA", "sm", 3, 2, 5, 6),
  H("Test plan for checkout", "QA", "sm", 9, 2, 4, 4),
  H("Smoke tests on Android", "QA", "sm", 16, 1, 3, 3),
  H("Launch runbook", "Ops", "ak", 6, 2, 4, 4),
  H("Vendor contracts", "Ops", "me", 25, 4, 5, 6, "l"),
];

// Keyword → module, for module detection (rule-based, works on English + common Roman Urdu terms)
export const MODULE_KEYWORDS: Record<string, string[]> = {
  Payment: ["payment", "checkout", "stripe", "invoice", "refund", "billing", "currency", "price", "pricing page"],
  Auth: ["login", "auth", "oauth", "password", "session", "signup", "sign up", "biometric", "2fa", "otp"],
  UI: ["design", "ui", "button", "layout", "hero", "color", "palette", "icon", "menu", "footer", "css", "wireframe"],
  Mobile: ["android", "ios", "mobile", "push", "app v2", "notification"],
  Content: ["copy", "blog", "press", "email", "announcement", "content", "faq", "release notes"],
  DevOps: ["deploy", "ci", "server", "infra", "log", "analytics", "monitoring"],
  QA: ["qa", "test", "regression", "smoke", "bug bash"],
  Ops: ["rollout", "launch", "checklist", "plan", "vendor", "runbook"],
};

// How critical each module is (1–10), for auto-prioritization. Editable in Settings.
export const MODULE_CRITICALITY: Record<string, number> = {
  Payment: 10,
  Auth: 10,
  Mobile: 7,
  DevOps: 7,
  QA: 6,
  UI: 5,
  Ops: 5,
  Content: 3,
  General: 4,
};

export const INITIAL_CLIENTS: Client[] = [
  { id: "cl1", name: "Northwind Traders", email: "pm@northwind.example", projectId: "p1", hourlyRate: 40, budget: 3000, reportDay: "Fri" },
  { id: "cl2", name: "Globex Mobile", email: "cto@globex.example", projectId: "p2", hourlyRate: 55, budget: 5000, reportDay: "Mon" },
];

export const INITIAL_TEMPLATES: TaskTemplate[] = [
  {
    id: "tpl-client",
    name: "New client website",
    tasks: [
      { title: "Kickoff call", status: "todo", priority: "m", labels: ["Ops"], subtasks: ["Agenda", "Send notes"] },
      { title: "Sitemap and wireframes", status: "todo", priority: "h", labels: ["Design"], subtasks: ["Sitemap", "Wireframes"] },
      { title: "Build pages", status: "todo", priority: "m", labels: ["Dev"], subtasks: ["Home", "About", "Contact"] },
      { title: "Client review", status: "todo", priority: "m", labels: ["Ops"], subtasks: [] },
    ],
  },
  {
    id: "tpl-bug",
    name: "Bug triage",
    tasks: [
      { title: "Reproduce the bug", status: "todo", priority: "h", labels: ["Bug"], subtasks: ["Steps", "Environment"] },
      { title: "Fix and add a test", status: "todo", priority: "h", labels: ["Bug", "Dev"], subtasks: [] },
      { title: "Verify on staging", status: "todo", priority: "m", labels: ["QA"], subtasks: [] },
    ],
  },
];

export const BOARD_TEMPLATES: { name: string; columns: [string, number][] }[] = [
  { name: "Dev", columns: [["Backlog", 0], ["To do", 0], ["In progress", 3], ["Review", 2], ["Done", 0]] },
  { name: "HR", columns: [["Pending", 0], ["Interview", 0], ["Shortlisted", 0], ["Rejected", 0]] },
  { name: "Sales", columns: [["Lead", 0], ["Call", 0], ["Demo", 0], ["Negotiation", 0], ["Closed", 0]] },
  { name: "Agency", columns: [["Brief", 0], ["Design", 0], ["Dev", 3], ["QA", 0], ["Client review", 0], ["Live", 0]] },
];

export const INITIAL_RULES: AutomationRule[] = [
  { id: "r1", name: "Escalate new high-priority bugs", trigger: "priority_high", action: "notify_owner", active: true, runs: 3 },
  { id: "r2", name: "Tag overdue tasks", trigger: "overdue", action: "add_label", param: "Late", active: false, runs: 0 },
];

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}
