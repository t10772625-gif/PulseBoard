"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityEvent,
  Attachment,
  AuditEvent,
  AutomationRule,
  BoardFilters,
  Branding,
  Client,
  Comment,
  CustomFieldDef,
  Health,
  HistoryItem,
  Member,
  MemberId,
  Notification,
  Plan,
  Project,
  ProjectId,
  SavedFilter,
  ShareLink,
  Status,
  Task,
  TaskTemplate,
  TrackingSession,
  View,
  WebhookDelivery,
} from "@/types";
import {
  COLUMNS,
  DEFAULT_CAPACITY,
  HISTORY,
  INITIAL_ACTIVITY,
  INITIAL_CLIENTS,
  INITIAL_COMMENTS,
  INITIAL_DAY_SCHEDULE,
  INITIAL_NOTIFICATIONS,
  INITIAL_RULES,
  INITIAL_TASKS,
  INITIAL_TEMPLATES,
  MEMBERS,
  PROJECTS,
  STATUS_LABEL,
} from "./mock-data";
import { PLANS, hasFeature } from "./plans";
import { DEFAULT_LOCALE, isSupportedLocale, loadLocale, tr } from "@/i18n";
import { getSupabase, supabaseConfigured } from "./supabase/client";
import { initials, loadWorkspace, repo, rowToTask, type Invite, type Repo } from "./supabase/repo";
import { DEFAULT_PERMISSIONS, canEditRole, lockedForRole, type PermissionKey, type PermissionMatrix } from "./permissions";

export type ColumnDef = [Status, string, number];

export function isBlocked(task: Task, tasks: Task[]): boolean {
  if (!task.blockedBy) return false;
  const blocker = tasks.find((t) => t.id === task.blockedBy);
  return !!blocker && blocker.status !== "done";
}

function bugPenalty(task: Task): number {
  if (task.status === "done" || !task.labels.includes("Bug")) return 0;
  const base = task.priority === "h" ? 10 : 5;
  const agePenalty = Math.min(10, Math.floor(task.createdDaysAgo / 7) * 2);
  return base + agePenalty;
}

export function health(projectId: ProjectId, tasks: Task[]): Health {
  const ts = tasks.filter((t) => t.projectId === projectId);
  const overdue = ts.filter((t) => t.status !== "done" && t.dueOffset < 0).length;
  const blocked = ts.filter((t) => isBlocked(t, tasks)).length;
  const overflow =
    Math.max(0, ts.filter((t) => t.status === "prog").length - 3) +
    Math.max(0, ts.filter((t) => t.status === "rev").length - 2);
  const openBugs = ts.filter((t) => t.status !== "done" && t.labels.includes("Bug"));
  const bugPoints = openBugs.reduce((sum, t) => sum + bugPenalty(t), 0);
  const overduePoints = overdue * 16;
  const blockedPoints = blocked * 9;
  const overflowPoints = overflow * 8;
  const score = ts.length === 0 ? 100 : Math.max(25, 100 - overduePoints - blockedPoints - overflowPoints - bugPoints);
  const color = score >= 75 ? "#12B5A0" : score >= 50 ? "#F0A400" : "#E5483A";
  const label = score >= 75 ? tr("health.healthy") : score >= 50 ? tr("health.attention") : score < 40 ? tr("health.critical") : tr("health.atRisk");
  const breakdown: { label: string; points: number }[] = [];
  if (overdue > 0) breakdown.push({ label: tr("health.overdue", { n: overdue }), points: -overduePoints });
  if (blocked > 0) breakdown.push({ label: tr("health.blocked", { n: blocked }), points: -blockedPoints });
  if (openBugs.length > 0) breakdown.push({ label: tr("health.bugs", { n: openBugs.length }), points: -bugPoints });
  if (overflow > 0) breakdown.push({ label: tr("health.wip", { n: overflow }), points: -overflowPoints });
  return {
    score,
    overdue,
    blocked,
    bugs: openBugs.length,
    color,
    label,
    critical: score < 40,
    done: ts.filter((t) => t.status === "done").length,
    total: ts.length,
    breakdown,
  };
}

export function liveTrackedSeconds(task: Task, tracking: TrackingSession | null): number {
  if (!tracking || tracking.taskId !== task.id) return task.trackedSeconds;
  const running = tracking.status === "running" && tracking.startedAt ? (Date.now() - tracking.startedAt) / 1000 : 0;
  return task.trackedSeconds + tracking.accumulated + running;
}

type NewTaskDefaults = { projectId: ProjectId; status: Status } | null;

export type NewTaskInput = Partial<Omit<Task, "id">> & { projectId: ProjectId; title: string };

type TrashItem = { task: Task; comments: Comment[]; activity: ActivityEvent[]; attachments: Attachment[]; deletedAt: number };

type ToastAction = { label: string; run: () => void };

type Store = {
  loggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;

  currentProjectId: ProjectId;
  setCurrentProjectId: (id: ProjectId) => void;

  boardView: View;
  setBoardView: (v: View) => void;
  boardFilters: BoardFilters;
  toggleBoardFilter: (f: "mine" | "high" | "blk") => void;
  toggleAssigneeFilter: (id: MemberId) => void;
  clearAssigneeFilter: () => void;

  projects: Record<ProjectId, Project>;
  addProject: (name: string, description: string, color: string, gradient: string) => ProjectId;

  getColumns: (projectId: ProjectId) => ColumnDef[];
  addColumn: (projectId: ProjectId, label: string, limit?: number) => void;
  moveColumn: (projectId: ProjectId, status: Status, direction: -1 | 1) => void;
  renameColumn: (projectId: ProjectId, status: Status, label: string) => void;
  setColumnLimit: (projectId: ProjectId, status: Status, limit: number) => void;
  deleteColumn: (projectId: ProjectId, status: Status) => void;
  columnLabel: (projectId: ProjectId, status: Status) => string;
  applyBoardTemplate: (projectId: ProjectId, columns: [string, number][]) => void;

  addColumnProjectId: ProjectId | null;
  openAddColumnModal: (projectId: ProjectId) => void;
  closeAddColumnModal: () => void;

  tasks: Task[];
  addTask: (data: { projectId: ProjectId; status: Status; title: string; priority: "h" | "m" | "l"; assignee: MemberId; dueOffset: number }) => void;
  createTask: (data: NewTaskInput) => string;
  setTaskField: <K extends "status" | "priority" | "assignee">(id: string, field: K, value: Task[K]) => void;
  updateTask: (id: string, patch: Partial<Task>, note?: string) => void;
  updateTasks: (ids: string[], patch: Partial<Task>, note?: string) => void;
  toggleSubtask: (taskId: string, index: number) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleChecklist: (taskId: string, index: number) => void;
  addChecklistItem: (taskId: string, title: string) => void;
  deleteTask: (taskId: string) => void;
  deleteTasks: (ids: string[]) => void;
  cloneTask: (taskId: string) => string | null;

  trash: TrashItem[];
  restoreTasks: (ids: string[]) => void;
  purgeTrash: () => void;
  archived: Task[];
  archiveTasks: (ids: string[]) => void;
  unarchiveTasks: (ids: string[]) => void;

  selectedIds: string[];
  toggleSelect: (id: string) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;

  members: Record<MemberId, Member>;
  setMemberRole: (id: MemberId, role: Member["role"]) => void;
  capacity: Record<MemberId, number>;
  setCapacity: (id: MemberId, value: number) => void;
  history: HistoryItem[];

  comments: Record<string, Comment[]>;
  addComment: (taskId: string, text: string, parentId?: string | null) => void;
  toggleCommentLike: (taskId: string, commentId: string) => void;

  activity: Record<string, ActivityEvent[]>;
  audit: AuditEvent[];

  attachments: Record<string, Attachment[]>;
  addAttachments: (taskId: string, files: FileList | File[]) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;

  notifications: Notification[];
  markAllRead: () => void;
  markRead: (index: number) => void;
  notify: (taskId: string, message: string) => void;

  daySchedule: Record<number, string>;
  scheduleTask: (hour: number, taskId: string) => void;
  unscheduleTask: (hour: number) => void;

  timerSeconds: number;
  timerRunning: boolean;
  toggleTimer: () => void;
  resetTimer: (seconds: number) => void;

  tracking: TrackingSession | null;
  startTracking: (taskId: string) => void;
  pauseTracking: () => void;
  endTracking: () => void;

  vote: number | null;
  setVote: (v: number) => void;
  survey: Partial<Record<MemberId, number>>;

  // Plan & gating
  plan: Plan;
  setPlan: (p: Plan) => void;
  // Owner-only plan change: local in demo mode, saved to the database in real mode
  // (test switch until Stripe billing exists; no payment is taken)
  changePlan: (p: Plan) => Promise<boolean>;
  can: (featureId: string) => boolean;
  aiUses: number;
  spendAi: () => boolean;

  // Customization
  customFields: CustomFieldDef[];
  addCustomField: (def: Omit<CustomFieldDef, "id">) => void;
  removeCustomField: (id: string) => void;
  savedFilters: SavedFilter[];
  saveFilter: (name: string, query: string) => void;
  removeFilter: (id: string) => void;
  templates: TaskTemplate[];
  saveTemplate: (name: string, projectId: ProjectId) => void;
  applyTemplate: (templateId: string, projectId: ProjectId) => number;

  // Automation
  rules: AutomationRule[];
  addRule: (rule: Omit<AutomationRule, "id" | "runs">) => void;
  toggleRule: (id: string) => void;
  removeRule: (id: string) => void;
  runOverdueRules: () => number;
  webhookLog: WebhookDelivery[];

  // Clients & sharing
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  shareLinks: ShareLink[];
  createShareLink: (kind: ShareLink["kind"], targetId: string) => string;
  revokeShareLink: (token: string) => void;
  branding: Branding;
  setBranding: (b: Partial<Branding>) => void;

  // Focus
  taskSwitches: number;
  standups: Partial<Record<MemberId, { yesterday: string; today: string; blockers: string; at: number }>>;
  postStandup: (u: { yesterday: string; today: string; blockers: string }) => void;
  focusTaskId: string | null;
  setFocusTaskId: (id: string | null) => void;
  dndUntil: number | null;
  setDnd: (minutes: number | null) => void;
  digestMode: boolean;
  setDigestMode: (v: boolean) => void;

  // Settings
  integrations: Record<string, boolean>;
  toggleIntegration: (key: string) => void;
  // Interface language (a code from src/i18n/locales.json). Saved per browser for
  // now; a per-user / per-workspace saved preference needs a database migration.
  language: string;
  setLanguage: (l: string) => void;
  viewAsRole: Member["role"];
  setViewAsRole: (r: Member["role"]) => void;
  canEdit: boolean;
  // RBAC: the signed-in user's real role, the admin-editable matrix, and a check
  myRole: Member["role"];
  permissions: PermissionMatrix;
  setPermission: (role: Member["role"], key: PermissionKey, value: boolean) => void;
  resetPermissions: (role: Member["role"]) => void;
  allowed: (key: PermissionKey) => boolean;
  realMode: boolean;
  workspaceName: string;
  myEmail: string;
  // Real mode: "loading" until the workspace arrives from the database, "error" if it couldn't load
  workspaceStatus: "loading" | "ready" | "error";
  retryWorkspace: () => void;
  twoFactor: boolean;
  setTwoFactor: (v: boolean) => void;
  exportData: () => string;
  importData: (json: string) => boolean;

  openTaskId: string | null;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;

  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;

  newTaskDefaults: NewTaskDefaults;
  openNewTaskModal: (projectId: ProjectId, status?: Status) => void;
  closeNewTaskModal: () => void;

  newProjectOpen: boolean;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;

  inviteOpen: boolean;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  // Pre-approved emails (real mode only): open invites for this workspace
  invites: Invite[];
  refreshInvites: () => Promise<void>;
  addInvite: (email: string, role: Member["role"]) => Promise<string | null>;
  revokeInvite: (id: string) => Promise<void>;
  // Profile (real mode): rename yourself; returns an error message or null
  updateMyName: (name: string) => Promise<string | null>;

  toastMessage: string | null;
  toastAction: ToastAction | null;
  toast: (message: string, action?: ToastAction) => void;

  theme: "light" | "dark" | null;
  toggleTheme: () => void;
};

const Ctx = createContext<Store | null>(null);

// New ids are UUIDs so the same id works in the browser and as a Postgres primary key.
// crypto.randomUUID needs a secure context, so fall back to getRandomValues (e.g. LAN IP over http).
function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b: Uint8Array = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
// The prefix is kept at call sites for readability (what kind of id this is)
const nextId = (prefix: string) => (void prefix, uuid());

// Shallow field diff used to persist only what changed on a task
function changedFields(a: Task, b: Task): Partial<Task> {
  const out: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Task>) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out[k] = b[k];
  }
  return out as Partial<Task>;
}

// Demo mode (no Supabase env): the app runs on sample data. With Supabase configured,
// every piece of workspace data starts empty and comes only from the database.
const DEMO = !supabaseConfigured;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<ProjectId>("p1");
  const [boardView, setBoardView] = useState<View>("board");
  const [boardFilters, setBoardFilters] = useState<BoardFilters>({ mine: false, high: false, blk: false, assignees: [] });
  const [projects, setProjects] = useState<Record<ProjectId, Project>>(DEMO ? PROJECTS : {});
  const [customColumns, setCustomColumns] = useState<Record<ProjectId, ColumnDef[]>>({});
  const [tasks, setTasks] = useState<Task[]>(DEMO ? INITIAL_TASKS : []);
  const [members, setMembers] = useState<Record<MemberId, Member>>(DEMO ? MEMBERS : {});
  const [comments, setComments] = useState<Record<string, Comment[]>>(DEMO ? INITIAL_COMMENTS : {});
  const [activity, setActivity] = useState<Record<string, ActivityEvent[]>>(DEMO ? INITIAL_ACTIVITY : {});
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>(DEMO ? INITIAL_NOTIFICATIONS : []);
  const [daySchedule, setDaySchedule] = useState<Record<number, string>>(DEMO ? INITIAL_DAY_SCHEDULE : {});
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [timerRunning, setTimerRunning] = useState(false);
  const [tracking, setTracking] = useState<TrackingSession | null>(null);
  const [vote, setVoteState] = useState<number | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newTaskDefaults, setNewTaskDefaults] = useState<NewTaskDefaults>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [addColumnProjectId, setAddColumnProjectId] = useState<ProjectId | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ToastAction | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [archived, setArchived] = useState<Task[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [capacity, setCapacityState] = useState<Record<MemberId, number>>(DEMO ? DEFAULT_CAPACITY : {});
  const [plan, setPlan] = useState<Plan>(DEMO ? "enterprise" : "basic");
  const [aiUses, setAiUses] = useState(0);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([
    { id: "cf-client", name: "Client", type: "text" },
    { id: "cf-size", name: "Size", type: "select", options: ["S", "M", "L"] },
  ]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    { id: "sf1", name: "My open tasks", query: "my open" },
    { id: "sf2", name: "Overdue", query: "overdue" },
    { id: "sf3", name: "High priority", query: "high open" },
  ]);
  const [templates, setTemplates] = useState<TaskTemplate[]>(INITIAL_TEMPLATES);
  const [rules, setRules] = useState<AutomationRule[]>(DEMO ? INITIAL_RULES : []);
  const [webhookLog, setWebhookLog] = useState<WebhookDelivery[]>([]);
  const [clients, setClients] = useState<Client[]>(DEMO ? INITIAL_CLIENTS : []);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [branding, setBrandingState] = useState<Branding>({ name: "PulseBoard", color: "#12B5A0", domain: "", domainStatus: "none" });
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [dndUntil, setDndUntil] = useState<number | null>(null);
  const [digestMode, setDigestMode] = useState(false);
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({ github: DEMO, slack: false, gcal: false, gmail: false });
  const [language, setLanguageState] = useState<string>(DEFAULT_LOCALE);
  // The language only switches once its file has loaded, so every component
  // (including text built outside React, e.g. labels and toasts) re-renders in it at once.
  const setLanguage = useCallback((l: string) => {
    if (!isSupportedLocale(l)) return;
    try {
      localStorage.setItem("pb_lang", l);
    } catch {}
    loadLocale(l).then(() => setLanguageState(l));
  }, []);
  useEffect(() => {
    let saved: string | null = null;
    try {
      // A ?lang= link (e.g. a shared pricing page) wins over the saved choice and is remembered
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (isSupportedLocale(fromUrl)) localStorage.setItem("pb_lang", fromUrl);
      saved = localStorage.getItem("pb_lang");
    } catch {}
    if (isSupportedLocale(saved) && saved !== DEFAULT_LOCALE) loadLocale(saved).then(() => setLanguageState(saved));
  }, []);
  // viewAsRole = the role the UI currently acts as. It starts as your real role;
  // Owner/Admin can preview a lower role from Settings.
  const [viewAsRole, setViewAsRole] = useState<Member["role"]>("Owner");
  const [permissions, setPermissions] = useState<PermissionMatrix>(DEFAULT_PERMISSIONS);
  const [twoFactor, setTwoFactor] = useState(false);
  const [taskSwitches, setTaskSwitches] = useState(0);
  const [standups, setStandups] = useState<Store["standups"]>(
    DEMO
      ? {
          ak: { yesterday: "Pricing page draft", today: "Onboarding wireframes review", blockers: "", at: 0 },
          ba: { yesterday: "Android crash repro", today: "Fix login crash", blockers: "Waiting for a test device", at: 0 },
        }
      : {}
  );
  const lastOpenedRef = useRef<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirrors of state that callbacks read without re-subscribing (automation rules, recurrence)
  const rulesRef = useRef(rules);
  const tasksRef = useRef(tasks);
  const trashRef = useRef(trash);
  const archivedRef = useRef(archived);
  const dndRef = useRef(dndUntil);
  const digestRef = useRef(digestMode);
  const membersRef = useRef(members);
  const planRef = useRef(plan);
  useEffect(() => {
    membersRef.current = members;
    planRef.current = plan;
  }, [members, plan]);
  // First name of the signed-in user, for activity messages ("Sara moved this to Done")
  const meName = () => membersRef.current.me?.name.split(" ")[0] ?? tr("common.you");
  useEffect(() => {
    digestRef.current = digestMode;
  }, [digestMode]);
  useEffect(() => {
    rulesRef.current = rules;
    tasksRef.current = tasks;
    trashRef.current = trash;
    archivedRef.current = archived;
    dndRef.current = dndUntil;
  }, [rules, tasks, trash, archived, dndUntil]);

  useEffect(() => {
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, []);

  const login = useCallback(() => setLoggedIn(true), []);
  // Sign out first, then drop the logged-in flag, so the app layout can't see the
  // old session mid-sign-out and log straight back in (that skipped the next load).
  const logout = useCallback(async () => {
    dbRef.current = null;
    await getSupabase()?.auth.signOut();
    setLoggedIn(false);
  }, []);

  // ---------- Supabase persistence (phase B2) ----------
  // dbRef is set once the workspace loads; with no Supabase config the app stays in demo mode.
  const dbRef = useRef<Repo | null>(null);
  const [realMode, setRealMode] = useState(false);
  const [invites, setInvitesState] = useState<Invite[]>([]);
  const [myEmail, setMyEmail] = useState(DEMO ? "ali@team.com" : "");
  const [workspaceName, setWorkspaceName] = useState("Demo workspace");
  const prevTasksRef = useRef<Task[] | null>(null);
  const prevColumnsRef = useRef<Record<ProjectId, ColumnDef[]> | null>(null);
  const skipColumnSyncRef = useRef(false);
  const skipTaskSyncRef = useRef(false); // set right before applying server data so it isn't written back
  const noInsertIds = useRef(new Set<string>()); // restored/unarchived rows already exist in the DB
  const notificationIds = useRef<(string | undefined)[]>([]);

  const persist = useCallback((fn: (r: Repo) => Promise<unknown>) => {
    const db = dbRef.current;
    if (!db) return;
    fn(db).catch((e: Error) => {
      // Raw database errors stay in the console, never in the UI (CLAUDE.md §6.1)
      console.error("[persist]", e);
      setToastMessage(tr("store.saveFailed"));
      setToastAction(null);
    });
  }, []);

  // Real mode: who is signed in (from Supabase auth events) and whether their workspace
  // has loaded. Loading is keyed on the user id, so every sign-in (including a new
  // sign-in after logout, or a different account) loads fresh data.
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<"loading" | "ready" | "error">(DEMO ? "ready" : "loading");
  const [reloadKey, setReloadKey] = useState(0);
  const retryWorkspace = useCallback(() => {
    setWorkspaceStatus("loading");
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    // Only set state in here: calling Supabase inside this callback can deadlock the auth client
    const { data } = sb.auth.onAuthStateChange((_event, session) => setAuthUid(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Drop every piece of tenant data (on logout, account switch or before a reload).
  // The load effect's cleanup also resets the repo and sync refs.
  const clearWorkspace = useCallback(() => {
    setWorkspaceStatus("loading");
    setRealMode(false);
    setProjects({});
    setCustomColumns({});
    setTasks([]);
    setArchived([]);
    setTrash([]);
    setMembers({});
    setCapacityState({});
    setComments({});
    setActivity({});
    setNotifications([]);
    setClients([]);
    setRules([]);
    setShareLinks([]);
    setAttachments({});
    setInvitesState([]);
    setSelectedIds([]);
    setOpenTaskId(null);
    setPermissions(DEFAULT_PERMISSIONS);
    setPlan("basic");
    setWorkspaceName("");
    setMyEmail("");
  }, []);

  // Load the workspace after sign-in and subscribe to live changes
  useEffect(() => {
    const sb = getSupabase();
    if (!loggedIn || !sb || !authUid) return;
    let cancelled = false;
    let channel: ReturnType<typeof sb.channel> | null = null;
    loadWorkspace(sb)
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setWorkspaceStatus("error");
          return;
        }
        skipTaskSyncRef.current = true;
        skipColumnSyncRef.current = true;
        prevTasksRef.current = d.tasks;
        prevColumnsRef.current = d.columns;
        setProjects(d.projects);
        setCustomColumns(d.columns);
        setTasks(d.tasks);
        setArchived(d.archived);
        setMembers(d.members);
        setCapacityState(d.capacity);
        setComments(d.comments);
        setActivity({});
        notificationIds.current = d.notifications.map((n) => n.id);
        setNotifications(d.notifications.map(({ id: _id, ...n }) => (void _id, n)));
        setClients(d.clients);
        setRules(d.rules);
        setShareLinks(d.shareLinks);
        setPlan(d.plan);
        setWorkspaceName(d.workspaceName);
        setMyEmail(d.meEmail);
        setDaySchedule({});
        setStandups({});
        setCurrentProjectId(Object.keys(d.projects)[0] ?? "");
        dbRef.current = repo(d.ctx);
        setPermissions(d.permissions);
        setAttachments(d.attachments);
        setViewAsRole(d.members.me?.role ?? "Viewer");
        const firstProject = Object.keys(d.projects)[0];
        if (firstProject) setCurrentProjectId(firstProject);
        setRealMode(true);
        setWorkspaceStatus("ready");

        channel = sb
          .channel(`ws-${d.ctx.ws}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `workspace_id=eq.${d.ctx.ws}` }, (payload) => {
            const row = payload.new as Parameters<typeof rowToTask>[1] | undefined;
            const oldId = (payload.old as { id?: string } | undefined)?.id;
            skipTaskSyncRef.current = true;
            setTasks((ts) => {
              if (payload.eventType === "DELETE" || !row || row.deleted_at || row.archived_at) return ts.filter((t) => t.id !== (row?.id ?? oldId));
              const next = rowToTask(d.ctx, row);
              return ts.some((t) => t.id === next.id) ? ts.map((t) => (t.id === next.id ? next : t)) : [...ts, next];
            });
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `workspace_id=eq.${d.ctx.ws}` }, (payload) => {
            const c = payload.new as { id: string; task_id: string; parent_id: string | null; author_id: string | null; body: string };
            setComments((all) =>
              (all[c.task_id] || []).some((x) => x.id === c.id)
                ? all
                : { ...all, [c.task_id]: [...(all[c.task_id] || []), { id: c.id, taskId: c.task_id, parentId: c.parent_id, author: c.author_id === d.ctx.uid ? "me" : c.author_id ?? "me", text: c.body, at: tr("time.justNow"), likedBy: [] }] }
            );
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${d.ctx.uid}` }, (payload) => {
            const n = payload.new as { id: string; task_id: string | null; message: string };
            if (notificationIds.current.includes(n.id)) return;
            notificationIds.current = [n.id, ...notificationIds.current];
            setNotifications((ns) => [{ unread: 1, taskId: n.task_id ?? "", message: n.message, when: tr("time.justNow") }, ...ns]);
          })
          .subscribe();
      })
      .catch(() => {
        // Never fall back to sample data in real mode; the layout shows an error with Retry
        if (!cancelled) setWorkspaceStatus("error");
      });
    return () => {
      cancelled = true;
      if (channel) sb.removeChannel(channel);
      dbRef.current = null;
      prevTasksRef.current = null;
      prevColumnsRef.current = null;
      notificationIds.current = [];
      clearWorkspace();
    };
  }, [loggedIn, authUid, reloadKey, clearWorkspace]);

  // Persist task changes by diffing against the previous list: new ids are inserted,
  // changed objects are updated with just the changed fields. Removals are persisted
  // explicitly (soft delete / archive), so they're ignored here.
  useEffect(() => {
    const prev = prevTasksRef.current;
    prevTasksRef.current = tasks;
    if (skipTaskSyncRef.current) {
      skipTaskSyncRef.current = false;
      return;
    }
    if (!dbRef.current || !prev) return;
    const before = new Map(prev.map((t) => [t.id, t]));
    for (const t of tasks) {
      const old = before.get(t.id);
      if (!old) {
        if (noInsertIds.current.delete(t.id)) continue;
        persist((r) => r.insertTask(t));
      } else if (old !== t) {
        const patch = changedFields(old, t);
        if (Object.keys(patch).length) persist((r) => r.updateTasks([t.id], patch));
      }
    }
  }, [tasks, persist]);

  // Persist board columns: any project whose column list changed is rewritten
  useEffect(() => {
    const prev = prevColumnsRef.current;
    prevColumnsRef.current = customColumns;
    if (skipColumnSyncRef.current) {
      skipColumnSyncRef.current = false;
      return;
    }
    if (!dbRef.current || !prev) return;
    for (const [projectId, cols] of Object.entries(customColumns)) {
      if (prev[projectId] !== cols) persist((r) => r.replaceColumns(projectId, cols));
    }
  }, [customColumns, persist]);

  const toast = useCallback((message: string, action?: ToastAction) => {
    setToastMessage(message);
    setToastAction(action ?? null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => {
        setToastMessage(null);
        setToastAction(null);
      },
      action ? 5000 : 2200
    );
  }, []);

  const changePlan = useCallback(
    async (p: Plan) => {
      const db = dbRef.current;
      if (!db) {
        setPlan(p);
        return true;
      }
      try {
        await db.setPlan(p);
        setPlan(p);
        toast(tr("planPage.switched", { plan: tr(`plan.${p}`) }));
        return true;
      } catch (e) {
        // Raw database text stays in the console; the user gets a clear reason
        console.error("[plan]", e);
        const msg = e instanceof Error ? e.message : "";
        toast(
          /turned off/i.test(msg)
            ? tr("planPage.switchOff")
            : /owner/i.test(msg)
              ? tr("planPage.switchOwner")
              : /function|schema cache/i.test(msg)
                ? tr("planPage.switchMissing")
                : tr("store.saveFailed")
        );
        return false;
      }
    },
    [toast]
  );

  const logActivity = useCallback((taskId: string, message: string) => {
    setActivity((a) => ({
      ...a,
      [taskId]: [{ id: nextId("a"), taskId, actor: "me" as MemberId, message, at: tr("time.justNow") }, ...(a[taskId] || [])],
    }));
    setAudit((a) => [{ id: nextId("ev"), at: Date.now(), actor: "me" as MemberId, message, taskId }, ...a].slice(0, 500));
    persist((r) => r.logEvent(taskId, "activity", message));
  }, [persist]);

  const notify = useCallback((taskId: string, message: string) => {
    setNotifications((ns) => [{ unread: 1, taskId, message, when: tr("time.justNow") }, ...ns]);
    notificationIds.current = [undefined, ...notificationIds.current];
    persist((r) => r.notifyUser("me", taskId || null, message));
    // Browser push (MOB-04) when the tab is in the background and permission was granted.
    // Do Not Disturb (TIME-04) keeps the inbox entry but skips the popup.
    const muted = dndRef.current !== null && dndRef.current > Date.now();
    // Smart digest (NOTIF-03): only urgent alerts pop up; the rest wait in the inbox
    const urgent = /overdue|high|⚡|blocked|assigned/i.test(message);
    if (!muted && (!digestRef.current || urgent) &&typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted" && document.hidden) {
      new window.Notification("PulseBoard", { body: message });
    }
  }, [persist]);

  // Automation engine (SPEC #21): runs matching active rules for an event.
  // Changes made by rules don't re-trigger rules, so they can't loop.
  const runRules = useCallback(
    (trigger: AutomationRule["trigger"], task: Task) => {
      const matching = rulesRef.current.filter((r) => r.active && r.trigger === trigger);
      if (!matching.length) return;
      for (const r of matching) {
        if (r.action === "notify_owner") notify(task.id, tr("store.ruleNotify", { rule: r.name, title: task.title }));
        if (r.action === "assign_me") setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, assignee: "me" } : t)));
        if (r.action === "set_high") setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, priority: "h" } : t)));
        if (r.action === "add_label" && r.param)
          setTasks((ts) => ts.map((t) => (t.id === task.id && !t.labels.includes(r.param!) ? { ...t, labels: [...t.labels, r.param!] } : t)));
        if (r.action === "webhook")
          setWebhookLog((l) => [{ id: nextId("wh"), at: Date.now(), url: r.param || "(no URL)", event: `${trigger}:${task.id}`, ok: !!r.param }, ...l].slice(0, 50));
      }
      setRules((rs) => rs.map((r) => (matching.some((m) => m.id === r.id) ? { ...r, runs: r.runs + 1 } : r)));
    },
    [notify]
  );

  const addProject = useCallback(
    (name: string, description: string, color: string, gradient: string) => {
      const id = nextId("p");
      const project = { id, name, description, color, gradient };
      setProjects((p) => ({ ...p, [id]: project }));
      persist((r) => r.insertProject(project, COLUMNS));
      return id;
    },
    [persist]
  );

  const getColumns = useCallback((projectId: ProjectId) => customColumns[projectId] ?? COLUMNS, [customColumns]);

  const addColumn = useCallback((projectId: ProjectId, label: string, limit: number = 0) => {
    const id = nextId("col");
    setCustomColumns((c) => ({ ...c, [projectId]: [...(c[projectId] ?? COLUMNS), [id, label, limit] as ColumnDef] }));
  }, []);

  const moveColumn = useCallback((projectId: ProjectId, status: Status, direction: -1 | 1) => {
    setCustomColumns((c) => {
      const cols = [...(c[projectId] ?? COLUMNS)];
      const i = cols.findIndex((col) => col[0] === status);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= cols.length) return c;
      [cols[i], cols[j]] = [cols[j], cols[i]];
      return { ...c, [projectId]: cols };
    });
  }, []);

  const renameColumn = useCallback((projectId: ProjectId, status: Status, label: string) => {
    setCustomColumns((c) => ({
      ...c,
      [projectId]: (c[projectId] ?? COLUMNS).map((col) => (col[0] === status ? ([col[0], label, col[2]] as ColumnDef) : col)),
    }));
  }, []);

  const setColumnLimit = useCallback((projectId: ProjectId, status: Status, limit: number) => {
    setCustomColumns((c) => ({
      ...c,
      [projectId]: (c[projectId] ?? COLUMNS).map((col) => (col[0] === status ? ([col[0], col[1], limit] as ColumnDef) : col)),
    }));
  }, []);

  const columnLabel = useCallback(
    (projectId: ProjectId, status: Status) => {
      const found = (customColumns[projectId] ?? COLUMNS).find((c) => c[0] === status);
      if (!found) return status;
      // A default column still named in English shows in the current language;
      // a name the team typed (renamed / template column) is shown as written.
      const def = COLUMNS.find((c) => c[0] === status);
      return def && found[1] === def[1] ? STATUS_LABEL[status as keyof typeof STATUS_LABEL] : found[1];
    },
    [customColumns]
  );

  // Industry templates (CORE-03). Existing tasks keep working: the first/last
  // template columns reuse the "todo"/"done" ids that health and locking rely on.
  const applyBoardTemplate = useCallback((projectId: ProjectId, cols: [string, number][]) => {
    const defs: ColumnDef[] = cols.map(([label, limit], i) => [i === 0 ? "todo" : i === cols.length - 1 ? "done" : i === 1 && cols.length > 2 ? "prog" : nextId("col"), label, limit]);
    setCustomColumns((c) => ({ ...c, [projectId]: defs }));
    const valid = new Set(defs.map((d) => d[0]));
    setTasks((ts) => ts.map((t) => (t.projectId === projectId && !valid.has(t.status) ? { ...t, status: "todo" } : t)));
  }, []);

  const createTask = useCallback(
    (data: NewTaskInput) => {
      const id = nextId("t");
      const task: Task = {
        status: "todo",
        priority: "m",
        assignee: "me",
        dueOffset: 7,
        barStart: 0,
        lengthDays: 5,
        labels: [],
        subtasks: [],
        description: "",
        trackedSeconds: 0,
        createdDaysAgo: 0,
        ...data,
        id,
      };
      setTasks((ts) => [...ts, task]);
      setActivity((a) => ({ ...a, [id]: [{ id: nextId("a"), taskId: id, actor: "me", message: tr("store.taskCreatedBy", { name: meName() }), at: tr("time.justNow") }] }));
      setAudit((a) => [{ id: nextId("ev"), at: Date.now(), actor: "me" as MemberId, message: tr("store.auditCreated", { title: task.title }), taskId: id }, ...a]);
      runRules("created", task);
      if (task.priority === "h") runRules("priority_high", task);
      return id;
    },
    [runRules]
  );

  const addTask = useCallback(
    (data: { projectId: ProjectId; status: Status; title: string; priority: "h" | "m" | "l"; assignee: MemberId; dueOffset: number }) => {
      createTask({ ...data, labels: ["New"] });
    },
    [createTask]
  );

  // Recurring tasks (CORE-11): completing one creates the next occurrence.
  const spawnRecurrence = useCallback(
    (task: Task) => {
      if (!task.recurrence || task.recurrence === "none") return;
      const step = task.recurrence === "daily" ? 1 : task.recurrence === "weekly" ? 7 : 30;
      createTask({
        projectId: task.projectId,
        title: task.title,
        priority: task.priority,
        assignee: task.assignee,
        labels: task.labels,
        description: task.description,
        recurrence: task.recurrence,
        dueOffset: task.dueOffset + step,
        subtasks: task.subtasks.map((s) => [s[0], 0] as [string, 0 | 1]),
        checklist: task.checklist?.map((s) => [s[0], 0] as [string, 0 | 1]),
      });
      toast(tr("store.nextScheduled", { title: task.title }));
    },
    [createTask, toast]
  );

  const setTaskField = useCallback(
    <K extends "status" | "priority" | "assignee">(id: string, field: K, value: Task[K]) => {
      const before = tasksRef.current.find((t) => t.id === id);
      setTasks((ts) =>
        ts.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, [field]: value };
          if (field === "status" && value === "done") next.completedDaysAgo = 0;
          if (field === "status" && value === "prog" && t.startedDaysAgo === undefined) next.startedDaysAgo = 0;
          return next;
        })
      );
      if (field === "status") {
        const label = before ? columnLabel(before.projectId, value as Status) : (value as string);
        logActivity(id, tr("store.actMoved", { name: meName(), column: label }));
        if (value === "done" && before && before.status !== "done") {
          runRules("status_done", before);
          spawnRecurrence(before);
        }
      }
      if (field === "priority") {
        logActivity(id, tr("store.actPriority", { name: meName(), priority: tr(`priority.${value as "h" | "m" | "l"}`) }));
        if (value === "h" && before) runRules("priority_high", before);
      }
      if (field === "assignee") {
        logActivity(id, tr("store.actReassigned", { name: meName(), assignee: membersRef.current[value as MemberId]?.name ?? String(value) }));
        if (before) runRules("assigned", before);
        if (value === "me" && before && before.assignee !== "me") notify(id, tr("store.youAssigned", { title: before.title }));
        // Tell a teammate they were assigned (their inbox, via the notifications table)
        if (value !== "me" && before && before.assignee !== value) {
          persist((r) => r.notifyUser(value as MemberId, id, tr("store.assignedYou", { name: meName(), title: before.title })));
          // Real email on assignment (Pro: NOTIF-02)
          if (hasFeature(planRef.current, "NOTIF-02"))
            persist((r) => r.emailUser(value as MemberId, tr("store.emailAssignedSubject", { title: before.title }), tr("store.emailAssignedBody", { name: meName(), title: before.title }), `${window.location.origin}/projects/${before.projectId}`));
        }
      }
    },
    [logActivity, columnLabel, runRules, spawnRecurrence, notify, persist]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>, note?: string) => {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (note) logActivity(id, note);
    },
    [logActivity]
  );

  const updateTasks = useCallback(
    (ids: string[], patch: Partial<Task>, note?: string) => {
      const set = new Set(ids);
      setTasks((ts) => ts.map((t) => (set.has(t.id) ? { ...t, ...patch } : t)));
      if (note) ids.forEach((id) => logActivity(id, note));
    },
    [logActivity]
  );

  const toggleSubtask = useCallback(
    (taskId: string, index: number) => {
      let label = "";
      let nowDone = false;
      setTasks((ts) =>
        ts.map((t) => {
          if (t.id !== taskId) return t;
          const subtasks = t.subtasks.map((s, i) => {
            if (i !== index) return s;
            label = s[0];
            nowDone = !s[1];
            return [s[0], s[1] ? 0 : 1] as [string, 0 | 1];
          });
          return { ...t, subtasks };
        })
      );
      logActivity(taskId, tr("store.actSubtask", { name: meName(), label, state: nowDone ? tr("store.stateDone") : tr("store.stateNotDone") }));
    },
    [logActivity]
  );

  const addSubtask = useCallback(
    (taskId: string, title: string) => {
      setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, [title, 0] as [string, 0 | 1]] } : t)));
      logActivity(taskId, tr("store.actAddSubtask", { name: meName(), title }));
    },
    [logActivity]
  );

  const toggleChecklist = useCallback((taskId: string, index: number) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId ? { ...t, checklist: (t.checklist ?? []).map((s, i) => (i === index ? ([s[0], s[1] ? 0 : 1] as [string, 0 | 1]) : s)) } : t
      )
    );
  }, []);

  const addChecklistItem = useCallback(
    (taskId: string, title: string) => {
      setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, checklist: [...(t.checklist ?? []), [title, 0] as [string, 0 | 1]] } : t)));
      logActivity(taskId, tr("store.actAddChecklist", { name: meName(), title }));
    },
    [logActivity]
  );

  // Soft delete (CORE-04, CORE-21, CORE-22): tasks move to trash with their
  // comments/activity/files so Undo restores everything.
  const restoreTasks = useCallback((ids: string[]) => {
    const back = trashRef.current.filter((x) => ids.includes(x.task.id));
    if (!back.length) return;
    const live = new Set(tasksRef.current.map((t) => t.id));
    const fresh = back.filter((x) => !live.has(x.task.id));
    setTasks((ts) => [...ts, ...fresh.map((x) => x.task)]);
    setComments((c) => ({ ...c, ...Object.fromEntries(back.map((x) => [x.task.id, x.comments])) }));
    setActivity((a) => ({ ...a, ...Object.fromEntries(back.map((x) => [x.task.id, x.activity])) }));
    setAttachments((a) => ({ ...a, ...Object.fromEntries(back.map((x) => [x.task.id, x.attachments])) }));
    setTrash((tr) => tr.filter((x) => !ids.includes(x.task.id)));
    // The row still exists (soft deleted), so clear deleted_at instead of inserting
    fresh.forEach((x) => noInsertIds.current.add(x.task.id));
    persist((r) => r.restore(back.map((x) => x.task.id)));
  }, [persist]);

  const deleteTasks = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      const set = new Set(ids);
      const removed = tasksRef.current.filter((t) => set.has(t.id));
      setTrash((tr) => [
        ...removed.map((task) => ({
          task,
          comments: comments[task.id] || [],
          activity: activity[task.id] || [],
          attachments: attachments[task.id] || [],
          deletedAt: Date.now(),
        })),
        ...tr,
      ]);
      setTasks((ts) => ts.filter((t) => !set.has(t.id)));
      setNotifications((ns) => ns.filter((n) => !set.has(n.taskId)));
      setDaySchedule((d) => {
        const next: Record<number, string> = {};
        for (const [h, id] of Object.entries(d)) if (!set.has(id)) next[Number(h)] = id;
        return next;
      });
      setTracking((t) => (t && set.has(t.taskId) ? null : t));
      setOpenTaskId((id) => (id && set.has(id) ? null : id));
      setSelectedIds((s) => s.filter((id) => !set.has(id)));
      setAudit((a) => [{ id: nextId("ev"), at: Date.now(), actor: "me" as MemberId, message: tr("store.auditDeleted", { n: removed.length }) }, ...a]);
      persist((r) => r.softDelete(removed.map((t) => t.id)));
      toast(tr("store.deleted", { n: removed.length }), { label: tr("store.undo"), run: () => restoreTasks(ids) });
    },
    [comments, activity, attachments, toast, restoreTasks, persist]
  );

  const deleteTask = useCallback((taskId: string) => deleteTasks([taskId]), [deleteTasks]);

  const purgeTrash = useCallback(() => {
    trashRef.current.forEach((x) => x.attachments.forEach((f) => URL.revokeObjectURL(f.url)));
    const ids = trashRef.current.map((x) => x.task.id);
    setTrash([]);
    persist((r) => r.hardDelete(ids));
  }, [persist]);

  const archiveTasks = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      const moving = tasksRef.current.filter((t) => set.has(t.id));
      setArchived((a) => [...moving, ...a]);
      setTasks((ts) => ts.filter((t) => !set.has(t.id)));
      setSelectedIds((s) => s.filter((id) => !set.has(id)));
      setOpenTaskId((id) => (id && set.has(id) ? null : id));
      persist((r) => r.setArchived(moving.map((t) => t.id), true));
      toast(tr("store.archived", { n: moving.length }), { label: tr("store.undo"), run: () => unarchiveRef.current(ids) });
    },
    [toast, persist]
  );

  const unarchiveTasks = useCallback(
    (ids: string[]) => {
      const live = new Set(tasksRef.current.map((t) => t.id));
      const back = archivedRef.current.filter((t) => ids.includes(t.id) && !live.has(t.id));
      back.forEach((t) => noInsertIds.current.add(t.id));
      setTasks((ts) => [...ts, ...back]);
      setArchived((a) => a.filter((t) => !ids.includes(t.id)));
      persist((r) => r.setArchived(back.map((t) => t.id), false));
    },
    [persist]
  );
  const unarchiveRef = useRef(unarchiveTasks);

  const cloneTask = useCallback(
    (taskId: string) => {
      const t = tasksRef.current.find((x) => x.id === taskId);
      if (!t) return null;
      const { id: _id, ...rest } = t;
      void _id;
      return createTask({ ...rest, title: t.title + " (copy)", status: "todo", trackedSeconds: 0, createdDaysAgo: 0, completedDaysAgo: undefined, startedDaysAgo: undefined });
    },
    [createTask]
  );

  const toggleSelect = useCallback((id: string) => setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])), []);
  const setSelection = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const setMemberRole = useCallback(
    (id: MemberId, role: Member["role"]) => {
      setMembers((m) => ({ ...m, [id]: { ...m[id], role } }));
      persist((r) => r.setMemberRole(id, role));
    },
    [persist]
  );
  const setCapacity = useCallback(
    (id: MemberId, value: number) => {
      const v = Math.max(1, value || 1);
      setCapacityState((c) => ({ ...c, [id]: v }));
      persist((r) => r.setCapacity(id, v));
    },
    [persist]
  );

  const addComment = useCallback(
    (taskId: string, text: string, parentId: string | null = null) => {
      const id = nextId("c");
      const comment: Comment = { id, taskId, parentId, author: "me" as MemberId, text, at: tr("time.justNow"), likedBy: [] };
      setComments((c) => ({ ...c, [taskId]: [...(c[taskId] || []), comment] }));
      persist((r) => r.insertComment(comment));
      logActivity(taskId, parentId ? tr("store.actReplied", { name: meName() }) : tr("store.actCommented", { name: meName() }));
      // @mentions notify the mentioned member (free-features #40)
      const title = tasksRef.current.find((t) => t.id === taskId)?.title ?? "a task";
      for (const m of Object.values(membersRef.current)) {
        if (m.id !== "me" && new RegExp(`@${m.name.split(" ")[0]}\\b`, "i").test(text)) {
          setAudit((a) => [{ id: nextId("ev"), at: Date.now(), actor: "me" as MemberId, message: tr("store.auditMentioned", { name: m.name }), taskId }, ...a]);
          persist((r) => r.notifyUser(m.id, taskId, tr("store.mentionedYou", { name: meName(), title })));
        }
      }
    },
    [logActivity, persist]
  );

  const toggleCommentLike = useCallback(
    (taskId: string, commentId: string) => {
      const cm = (comments[taskId] || []).find((x) => x.id === commentId);
      if (!cm) return;
      const likedBy = cm.likedBy.includes("me") ? cm.likedBy.filter((m) => m !== "me") : [...cm.likedBy, "me"];
      setComments((c) => ({ ...c, [taskId]: (c[taskId] || []).map((x) => (x.id === commentId ? { ...x, likedBy } : x)) }));
      persist((r) => r.setCommentLikes(commentId, likedBy));
    },
    [comments, persist]
  );

  // Files show instantly from a local object URL; with Supabase they're also
  // uploaded to the private bucket, where the plan's storage quota is enforced.
  const addAttachments = useCallback(
    (taskId: string, files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
      if (list.length === 0) return;
      const items: Attachment[] = list.map((f) => ({
        id: nextId("f"),
        taskId,
        url: URL.createObjectURL(f),
        kind: f.type.startsWith("video/") ? "video" : "image",
        name: f.name,
      }));
      setAttachments((a) => ({ ...a, [taskId]: [...(a[taskId] || []), ...items] }));
      logActivity(taskId, tr("store.actAttached", { name: meName(), n: items.length }));
      list.forEach((file, i) => persist((r) => r.uploadAttachment(items[i].id, taskId, file)));
    },
    [logActivity, persist]
  );

  const removeAttachment = useCallback(
    (taskId: string, attachmentId: string) => {
      setAttachments((a) => {
        const current = a[taskId] || [];
        const target = current.find((f) => f.id === attachmentId);
        if (target) URL.revokeObjectURL(target.url);
        return { ...a, [taskId]: current.filter((f) => f.id !== attachmentId) };
      });
      persist((r) => r.deleteAttachment(attachmentId));
    },
    [persist]
  );

  const toggleBoardFilter = useCallback((f: "mine" | "high" | "blk") => {
    setBoardFilters((bf) => ({ ...bf, [f]: !bf[f] }));
  }, []);

  const toggleAssigneeFilter = useCallback((id: MemberId) => {
    setBoardFilters((bf) => ({
      ...bf,
      assignees: bf.assignees.includes(id) ? bf.assignees.filter((a) => a !== id) : [...bf.assignees, id],
    }));
  }, []);
  const clearAssigneeFilter = useCallback(() => setBoardFilters((bf) => ({ ...bf, assignees: [] })), []);

  const markAllRead = useCallback(() => {
    setNotifications((ns) => ns.map((n) => ({ ...n, unread: 0 })));
    const ids = notificationIds.current.filter((x): x is string => !!x);
    persist((r) => r.markNotificationsRead(ids));
  }, [persist]);
  const markRead = useCallback(
    (index: number) => {
      setNotifications((ns) => ns.map((n, i) => (i === index ? { ...n, unread: 0 } : n)));
      const id = notificationIds.current[index];
      if (id) persist((r) => r.markNotificationsRead([id]));
    },
    [persist]
  );

  const scheduleTask = useCallback((hour: number, taskId: string) => {
    setDaySchedule((d) => {
      const next: Record<number, string> = {};
      for (const [h, id] of Object.entries(d)) if (id !== taskId) next[Number(h)] = id;
      next[hour] = taskId;
      return next;
    });
  }, []);
  const unscheduleTask = useCallback((hour: number) => {
    setDaySchedule((d) => {
      const next = { ...d };
      delete next[hour];
      return next;
    });
  }, []);

  const deleteColumn = useCallback(
    (projectId: ProjectId, status: Status) => {
      const cols = customColumns[projectId] ?? COLUMNS;
      if (cols.length <= 1) {
        toast(tr("store.oneColumn"));
        return;
      }
      const hasTasks = tasks.some((t) => t.projectId === projectId && t.status === status);
      if (hasTasks) {
        toast(tr("store.moveTasksFirst"));
        return;
      }
      setCustomColumns((c) => ({ ...c, [projectId]: cols.filter((col) => col[0] !== status) }));
    },
    [customColumns, tasks, toast]
  );

  const toggleTimer = useCallback(() => {
    const next = !timerRunning;
    if (tickTimer.current) clearInterval(tickTimer.current);
    if (next) {
      tickTimer.current = setInterval(() => {
        setTimerSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
      // Focus-time detection (TIME-09, reworked): a running focus session is the
      // signal PulseBoard can actually see, so it mutes notifications until it ends.
      setDndUntil(Date.now() + Math.max(60, timerSeconds) * 1000);
    }
    setTimerRunning(next);
  }, [timerRunning, timerSeconds]);

  const resetTimer = useCallback((seconds: number) => {
    if (tickTimer.current) clearInterval(tickTimer.current);
    setTimerRunning(false);
    setTimerSeconds(seconds);
  }, []);

  const finalizeTracking = useCallback((session: TrackingSession) => {
    const running = session.status === "running" && session.startedAt ? (Date.now() - session.startedAt) / 1000 : 0;
    const total = Math.round(session.accumulated + running);
    if (total > 0) {
      setTasks((ts) => ts.map((t) => (t.id === session.taskId ? { ...t, trackedSeconds: t.trackedSeconds + total } : t)));
    }
    return total;
  }, []);

  const startTracking = useCallback(
    (taskId: string) => {
      setTracking((current) => {
        if (current && current.taskId !== taskId) finalizeTracking(current);
        if (current && current.taskId === taskId && current.status === "paused") {
          return { ...current, status: "running", startedAt: Date.now() };
        }
        return { taskId, status: "running", startedAt: Date.now(), accumulated: 0 };
      });
    },
    [finalizeTracking]
  );

  const pauseTracking = useCallback(() => {
    setTracking((current) => {
      if (!current || current.status !== "running") return current;
      const elapsed = current.startedAt ? (Date.now() - current.startedAt) / 1000 : 0;
      return { ...current, status: "paused", startedAt: null, accumulated: current.accumulated + elapsed };
    });
  }, []);

  const endTracking = useCallback(() => {
    setTracking((current) => {
      if (!current) return current;
      const total = finalizeTracking(current);
      if (total > 0) logActivity(current.taskId, tr("store.actTracked", { name: meName(), n: Math.round(total / 60) }));
      return null;
    });
  }, [finalizeTracking, logActivity]);

  const setVote = useCallback((v: number) => setVoteState(v), []);
  const survey: Partial<Record<MemberId, number>> = { ak: 1, ba: 3, ...(vote !== null ? { me: vote } : {}) };

  const can = useCallback((featureId: string) => hasFeature(plan, featureId), [plan]);

  // ---------- RBAC ----------
  // The plan decides which features exist; the role matrix decides who may use them.
  const myRole: Member["role"] = members.me?.role ?? "Owner";
  const allowed = useCallback(
    (key: PermissionKey) => viewAsRole === "Owner" || (!lockedForRole(viewAsRole, key) && !!permissions[viewAsRole]?.[key]),
    [viewAsRole, permissions]
  );

  const setPermission = useCallback(
    (role: Member["role"], key: PermissionKey, value: boolean) => {
      if (!canEditRole(myRole, role) || (value && lockedForRole(role, key))) return;
      setPermissions((p) => ({ ...p, [role]: { ...p[role], [key]: value } }));
      persist((r) => r.setPermission(role, key, value));
    },
    [myRole, persist]
  );

  const resetPermissions = useCallback(
    (role: Member["role"]) => {
      if (!canEditRole(myRole, role)) return;
      setPermissions((p) => ({ ...p, [role]: DEFAULT_PERMISSIONS[role] }));
      persist((r) => r.resetPermissions(role));
    },
    [myRole, persist]
  );

  // AI usage cap per plan (pricing.md "Limits per Tier")
  const spendAi = useCallback(() => {
    const cap = PLANS[plan].aiPerMonth;
    if (aiUses >= cap) {
      toast(plan === "basic" ? tr("store.aiNeedsPro") : tr("store.aiLimit"));
      return false;
    }
    setAiUses((n) => n + 1);
    return true;
  }, [plan, aiUses, toast]);

  const addCustomField = useCallback((def: Omit<CustomFieldDef, "id">) => setCustomFields((f) => [...f, { ...def, id: nextId("cf") }]), []);
  const removeCustomField = useCallback((id: string) => setCustomFields((f) => f.filter((x) => x.id !== id)), []);
  const saveFilter = useCallback((name: string, query: string) => setSavedFilters((f) => [...f, { id: nextId("sf"), name, query }]), []);
  const removeFilter = useCallback((id: string) => setSavedFilters((f) => f.filter((x) => x.id !== id)), []);

  const saveTemplate = useCallback((name: string, projectId: ProjectId) => {
    const ts = tasksRef.current.filter((t) => t.projectId === projectId);
    setTemplates((tp) => [
      ...tp,
      {
        id: nextId("tpl"),
        name,
        tasks: ts.map((t) => ({ title: t.title, status: "todo", priority: t.priority, labels: t.labels, subtasks: t.subtasks.map((s) => s[0]) })),
      },
    ]);
  }, []);

  const applyTemplate = useCallback(
    (templateId: string, projectId: ProjectId) => {
      const tpl = templates.find((t) => t.id === templateId);
      if (!tpl) return 0;
      tpl.tasks.forEach((t, i) =>
        createTask({
          projectId,
          title: t.title,
          status: t.status,
          priority: t.priority,
          labels: t.labels,
          subtasks: t.subtasks.map((s) => [s, 0] as [string, 0 | 1]),
          dueOffset: 3 + i * 2,
        })
      );
      return tpl.tasks.length;
    },
    [templates, createTask]
  );

  const addRule = useCallback(
    (rule: Omit<AutomationRule, "id" | "runs">) => {
      const full = { ...rule, id: nextId("r"), runs: 0 };
      setRules((r) => [...r, full]);
      persist((db) => db.insertRule(full));
    },
    [persist]
  );
  const toggleRule = useCallback(
    (id: string) => {
      const cur = rulesRef.current.find((x) => x.id === id);
      if (!cur) return;
      setRules((r) => r.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
      persist((db) => db.updateRule(id, { active: !cur.active }));
    },
    [persist]
  );
  const removeRule = useCallback(
    (id: string) => {
      setRules((r) => r.filter((x) => x.id !== id));
      persist((db) => db.deleteRule(id));
    },
    [persist]
  );
  const runOverdueRules = useCallback(() => {
    const overdue = tasksRef.current.filter((t) => t.status !== "done" && t.dueOffset < 0);
    overdue.forEach((t) => runRules("overdue", t));
    return overdue.length;
  }, [runRules]);

  const addClient = useCallback(
    (c: Omit<Client, "id">) => {
      const full = { ...c, id: nextId("cl") };
      setClients((cs) => [...cs, full]);
      persist((db) => db.insertClient(full));
    },
    [persist]
  );
  const updateClient = useCallback(
    (id: string, patch: Partial<Client>) => {
      setClients((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      persist((db) => db.updateClient(id, patch));
    },
    [persist]
  );

  const createShareLink = useCallback(
    (kind: ShareLink["kind"], targetId: string) => {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
      setShareLinks((l) => [{ token, kind, targetId, createdAt: Date.now(), revoked: false }, ...l]);
      persist((db) => db.insertShareLink(token, kind, targetId));
      return token;
    },
    [persist]
  );
  const revokeShareLink = useCallback(
    (token: string) => {
      setShareLinks((l) => l.map((x) => (x.token === token ? { ...x, revoked: true } : x)));
      persist((db) => db.revokeShareLink(token));
    },
    [persist]
  );
  const setBranding = useCallback((b: Partial<Branding>) => setBrandingState((cur) => ({ ...cur, ...b })), []);

  const setDnd = useCallback((minutes: number | null) => setDndUntil(minutes ? Date.now() + minutes * 60000 : null), []);
  const toggleIntegration = useCallback((key: string) => setIntegrations((i) => ({ ...i, [key]: !i[key] })), []);

  // GDPR export (SEC-09) and backup/restore (ADV-05/06): the whole workspace as JSON.
  const exportData = useCallback(
    () =>
      JSON.stringify(
        { version: 1, exportedAt: new Date().toISOString(), projects, customColumns, tasks, archived, members, comments, activity, clients, rules, templates, customFields, savedFilters },
        null,
        2
      ),
    [projects, customColumns, tasks, archived, members, comments, activity, clients, rules, templates, customFields, savedFilters]
  );

  const importData = useCallback((json: string) => {
    // Restoring a JSON backup over a live database would overwrite teammates' work;
    // with Supabase, backups are restored server-side instead.
    if (dbRef.current) return false;
    try {
      const d = JSON.parse(json);
      if (d.version !== 1 || !Array.isArray(d.tasks)) return false;
      setProjects(d.projects);
      setCustomColumns(d.customColumns ?? {});
      setTasks(d.tasks);
      setArchived(d.archived ?? []);
      setMembers(d.members);
      setComments(d.comments ?? {});
      setActivity(d.activity ?? {});
      setClients(d.clients ?? []);
      setRules(d.rules ?? []);
      setTemplates(d.templates ?? []);
      setCustomFields(d.customFields ?? []);
      setSavedFilters(d.savedFilters ?? []);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Context-switch counter (TIME-08): opening a different task than the last one
  // counts as a switch. Personal only; shown just to the user on My Day.
  const openDrawer = useCallback((id: string) => {
    if (lastOpenedRef.current && lastOpenedRef.current !== id) setTaskSwitches((n) => n + 1);
    lastOpenedRef.current = id;
    setOpenTaskId(id);
  }, []);
  const postStandup = useCallback((u: { yesterday: string; today: string; blockers: string }) => {
    setStandups((s) => ({ ...s, me: { ...u, at: Date.now() } }));
  }, []);
  const closeDrawer = useCallback(() => setOpenTaskId(null), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openNewTaskModal = useCallback(
    (projectId: ProjectId, status: Status = "todo") => {
      // A new real workspace has no boards yet; a task needs one to live on
      if (!projects[projectId]) return toast(tr("voice.noBoard"));
      setNewTaskDefaults({ projectId, status });
    },
    [projects, toast]
  );
  const closeNewTaskModal = useCallback(() => setNewTaskDefaults(null), []);
  const openNewProjectModal = useCallback(() => setNewProjectOpen(true), []);
  const closeNewProjectModal = useCallback(() => setNewProjectOpen(false), []);
  const openAddColumnModal = useCallback((projectId: ProjectId) => setAddColumnProjectId(projectId), []);
  const closeAddColumnModal = useCallback(() => setAddColumnProjectId(null), []);
  const openInviteModal = useCallback(() => setInviteOpen(true), []);
  const closeInviteModal = useCallback(() => setInviteOpen(false), []);


  const refreshInvites = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    try {
      setInvitesState(await db.listInvites());
    } catch {
      setInvitesState([]);
    }
  }, []);
  // Returns an error message for the form, or null on success. DB errors are mapped, never shown raw.
  const addInvite = useCallback(
    async (email: string, role: Member["role"]) => {
      const db = dbRef.current;
      if (!db) return tr("store.inviteDemo");
      try {
        await db.insertInvite(email.trim().toLowerCase(), role);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("duplicate")) return tr("store.inviteDuplicate");
        if (msg.includes("row-level security")) return tr("store.inviteForbidden");
        if (msg.includes("check constraint")) return tr("store.inviteEmail");
        return tr("store.inviteFailed");
      }
      await refreshInvites();
      return null;
    },
    [refreshInvites]
  );
  const updateMyName = useCallback(async (name: string) => {
    const db = dbRef.current;
    const clean = name.trim().slice(0, 80);
    if (!clean) return tr("store.enterName");
    if (!db) return tr("store.profileDemo");
    try {
      await db.updateMyName(clean);
    } catch {
      return tr("store.nameFailed");
    }
    setMembers((m) => (m.me ? { ...m, me: { ...m.me, name: clean, initials: initials(clean, "") } } : m));
    return null;
  }, []);
  const revokeInvite = useCallback(
    async (id: string) => {
      setInvitesState((l) => l.filter((i) => i.id !== id));
      persist((db) => db.revokeInvite(id));
    },
    [persist]
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const isDark = t ? t === "dark" : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDark ? "light" : "dark";
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        loggedIn,
        login,
        logout,
        currentProjectId,
        setCurrentProjectId,
        boardView,
        setBoardView,
        boardFilters,
        toggleBoardFilter,
        toggleAssigneeFilter,
        clearAssigneeFilter,
        projects,
        addProject,
        getColumns,
        addColumn,
        moveColumn,
        renameColumn,
        setColumnLimit,
        deleteColumn,
        columnLabel,
        applyBoardTemplate,
        addColumnProjectId,
        openAddColumnModal,
        closeAddColumnModal,
        tasks,
        addTask,
        createTask,
        setTaskField,
        updateTask,
        updateTasks,
        toggleSubtask,
        addSubtask,
        toggleChecklist,
        addChecklistItem,
        deleteTask,
        deleteTasks,
        cloneTask,
        trash,
        restoreTasks,
        purgeTrash,
        archived,
        archiveTasks,
        unarchiveTasks,
        selectedIds,
        toggleSelect,
        setSelection,
        clearSelection,
        members,
        setMemberRole,
        capacity,
        setCapacity,
        // Past-sprint history is demo data only; with a real workspace it builds up from completed tasks
        history: realMode ? [] : HISTORY,
        comments,
        addComment,
        toggleCommentLike,
        activity,
        audit,
        attachments,
        addAttachments,
        removeAttachment,
        notifications,
        markAllRead,
        markRead,
        notify,
        daySchedule,
        scheduleTask,
        unscheduleTask,
        timerSeconds,
        timerRunning,
        toggleTimer,
        resetTimer,
        tracking,
        startTracking,
        pauseTracking,
        endTracking,
        vote,
        setVote,
        survey,
        plan,
        setPlan,
        changePlan,
        can,
        aiUses,
        spendAi,
        customFields,
        addCustomField,
        removeCustomField,
        savedFilters,
        saveFilter,
        removeFilter,
        templates,
        saveTemplate,
        applyTemplate,
        rules,
        addRule,
        toggleRule,
        removeRule,
        runOverdueRules,
        webhookLog,
        clients,
        addClient,
        updateClient,
        shareLinks,
        createShareLink,
        revokeShareLink,
        branding,
        setBranding,
        focusTaskId,
        setFocusTaskId,
        dndUntil,
        setDnd,
        digestMode,
        setDigestMode,
        integrations,
        toggleIntegration,
        language,
        setLanguage,
        viewAsRole,
        setViewAsRole,
        canEdit: allowed("task.edit"),
        myRole,
        permissions,
        setPermission,
        resetPermissions,
        allowed,
        realMode,
        workspaceName,
        myEmail,
        workspaceStatus,
        retryWorkspace,
        twoFactor,
        taskSwitches,
        standups,
        postStandup,
        setTwoFactor,
        exportData,
        importData,
        openTaskId,
        openDrawer,
        closeDrawer,
        paletteOpen,
        openPalette,
        closePalette,
        newTaskDefaults,
        openNewTaskModal,
        closeNewTaskModal,
        newProjectOpen,
        openNewProjectModal,
        closeNewProjectModal,
        inviteOpen,
        openInviteModal,
        closeInviteModal,
        invites,
        refreshInvites,
        addInvite,
        revokeInvite,
        updateMyName,
        toastMessage,
        toastAction,
        toast,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
};

export type { Status };
