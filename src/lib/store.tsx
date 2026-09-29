"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityEvent,
  Attachment,
  BoardFilters,
  Comment,
  Health,
  Member,
  MemberId,
  Notification,
  Project,
  ProjectId,
  Status,
  Task,
  TrackingSession,
  View,
} from "@/types";
import {
  COLUMNS,
  INITIAL_ACTIVITY,
  INITIAL_COMMENTS,
  INITIAL_DAY_SCHEDULE,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  MEMBERS,
  PROJECTS,
} from "./mock-data";

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
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Needs attention" : score < 40 ? "Critical" : "At risk";
  const breakdown: { label: string; points: number }[] = [];
  if (overdue > 0) breakdown.push({ label: `${overdue} overdue`, points: -overduePoints });
  if (blocked > 0) breakdown.push({ label: `${blocked} blocked`, points: -blockedPoints });
  if (openBugs.length > 0) breakdown.push({ label: `${openBugs.length} open bug${openBugs.length > 1 ? "s" : ""}`, points: -bugPoints });
  if (overflow > 0) breakdown.push({ label: `${overflow} over WIP limit`, points: -overflowPoints });
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

type Store = {
  loggedIn: boolean;
  login: () => void;
  logout: () => void;

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

  addColumnProjectId: ProjectId | null;
  openAddColumnModal: (projectId: ProjectId) => void;
  closeAddColumnModal: () => void;

  tasks: Task[];
  addTask: (data: { projectId: ProjectId; status: Status; title: string; priority: "h" | "m" | "l"; assignee: MemberId; dueOffset: number }) => void;
  setTaskField: <K extends "status" | "priority" | "assignee">(id: string, field: K, value: Task[K]) => void;
  toggleSubtask: (taskId: string, index: number) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteTask: (taskId: string) => void;

  members: Record<MemberId, Member>;
  setMemberRole: (id: MemberId, role: Member["role"]) => void;

  comments: Record<string, Comment[]>;
  addComment: (taskId: string, text: string, parentId?: string | null) => void;
  toggleCommentLike: (taskId: string, commentId: string) => void;

  activity: Record<string, ActivityEvent[]>;

  attachments: Record<string, Attachment[]>;
  addAttachments: (taskId: string, files: FileList | File[]) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;

  notifications: Notification[];
  markAllRead: () => void;
  markRead: (index: number) => void;

  daySchedule: Record<number, string>;
  scheduleTask: (hour: number, taskId: string) => void;
  unscheduleTask: (hour: number) => void;

  timerSeconds: number;
  timerRunning: boolean;
  toggleTimer: () => void;

  tracking: TrackingSession | null;
  startTracking: (taskId: string) => void;
  pauseTracking: () => void;
  endTracking: () => void;

  vote: number | null;
  setVote: (v: number) => void;

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

  toastMessage: string | null;
  toast: (message: string) => void;

  theme: "light" | "dark" | null;
  toggleTheme: () => void;
};

const Ctx = createContext<Store | null>(null);

let uid = 0;
const nextId = (prefix: string) => `${prefix}${Date.now()}-${uid++}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<ProjectId>("p1");
  const [boardView, setBoardView] = useState<View>("board");
  const [boardFilters, setBoardFilters] = useState<BoardFilters>({ mine: false, high: false, blk: false, assignees: [] });
  const [projects, setProjects] = useState<Record<ProjectId, Project>>(PROJECTS);
  const [customColumns, setCustomColumns] = useState<Record<ProjectId, ColumnDef[]>>({});
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [members, setMembers] = useState<Record<MemberId, Member>>(MEMBERS);
  const [comments, setComments] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [activity, setActivity] = useState<Record<string, ActivityEvent[]>>(INITIAL_ACTIVITY);
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [daySchedule, setDaySchedule] = useState<Record<number, string>>(INITIAL_DAY_SCHEDULE);
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
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, []);

  const login = useCallback(() => setLoggedIn(true), []);
  const logout = useCallback(() => setLoggedIn(false), []);

  const logActivity = useCallback((taskId: string, message: string) => {
    setActivity((a) => ({
      ...a,
      [taskId]: [{ id: nextId("a"), taskId, actor: "me" as MemberId, message, at: "Just now" }, ...(a[taskId] || [])],
    }));
  }, []);

  const addProject = useCallback((name: string, description: string, color: string, gradient: string) => {
    const id = nextId("p");
    setProjects((p) => ({ ...p, [id]: { id, name, description, color, gradient } }));
    return id;
  }, []);

  const getColumns = useCallback((projectId: ProjectId) => customColumns[projectId] ?? COLUMNS, [customColumns]);

  const addColumn = useCallback(
    (projectId: ProjectId, label: string, limit: number = 0) => {
      const id = nextId("col");
      setCustomColumns((c) => ({ ...c, [projectId]: [...(c[projectId] ?? COLUMNS), [id, label, limit] as ColumnDef] }));
    },
    []
  );

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
      return found ? found[1] : status;
    },
    [customColumns]
  );

  const addTask = useCallback(
    (data: { projectId: ProjectId; status: Status; title: string; priority: "h" | "m" | "l"; assignee: MemberId; dueOffset: number }) => {
      const id = nextId("t");
      setTasks((ts) => [
        ...ts,
        {
          id,
          title: data.title,
          projectId: data.projectId,
          status: data.status,
          priority: data.priority,
          assignee: data.assignee,
          dueOffset: data.dueOffset,
          barStart: 0,
          lengthDays: 5,
          labels: ["New"],
          subtasks: [],
          description: "",
          trackedSeconds: 0,
          createdDaysAgo: 0,
        },
      ]);
      setActivity((a) => ({ ...a, [id]: [{ id: nextId("a"), taskId: id, actor: "me", message: "Task created by Ali", at: "Just now" }] }));
    },
    []
  );

  const setTaskField = useCallback(
    <K extends "status" | "priority" | "assignee">(id: string, field: K, value: Task[K]) => {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
      if (field === "status") {
        const projectId = tasks.find((t) => t.id === id)?.projectId;
        const label = projectId ? columnLabel(projectId, value as Status) : (value as string);
        logActivity(id, "Ali moved this to " + label);
      }
      if (field === "priority") logActivity(id, "Ali changed priority to " + PRIORITY_LABELS[value as "h" | "m" | "l"]);
      if (field === "assignee") logActivity(id, "Ali reassigned this to " + (MEMBERS[value as MemberId]?.name ?? value));
    },
    [logActivity, tasks, columnLabel]
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
      logActivity(taskId, `Ali marked "${label}" as ${nowDone ? "done" : "not done"}`);
    },
    [logActivity]
  );

  const addSubtask = useCallback(
    (taskId: string, title: string) => {
      setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, [title, 0] as [string, 0 | 1]] } : t)));
      logActivity(taskId, `Ali added a subtask "${title}"`);
    },
    [logActivity]
  );

  const deleteTask = useCallback((taskId: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== taskId));
    setComments((c) => {
      const next = { ...c };
      delete next[taskId];
      return next;
    });
    setActivity((a) => {
      const next = { ...a };
      delete next[taskId];
      return next;
    });
    setAttachments((a) => {
      (a[taskId] || []).forEach((f) => URL.revokeObjectURL(f.url));
      const next = { ...a };
      delete next[taskId];
      return next;
    });
    setNotifications((ns) => ns.filter((n) => n.taskId !== taskId));
    setDaySchedule((d) => {
      const next: Record<number, string> = {};
      for (const [h, id] of Object.entries(d)) if (id !== taskId) next[Number(h)] = id;
      return next;
    });
    setTracking((t) => (t && t.taskId === taskId ? null : t));
    setOpenTaskId((id) => (id === taskId ? null : id));
  }, []);

  const setMemberRole = useCallback((id: MemberId, role: Member["role"]) => {
    setMembers((m) => ({ ...m, [id]: { ...m[id], role } }));
  }, []);

  const addComment = useCallback(
    (taskId: string, text: string, parentId: string | null = null) => {
      const id = nextId("c");
      setComments((c) => ({
        ...c,
        [taskId]: [...(c[taskId] || []), { id, taskId, parentId, author: "me" as MemberId, text, at: "Just now", likedBy: [] }],
      }));
      logActivity(taskId, parentId ? "Ali replied to a comment" : "Ali commented");
    },
    [logActivity]
  );

  const toggleCommentLike = useCallback((taskId: string, commentId: string) => {
    setComments((c) => ({
      ...c,
      [taskId]: (c[taskId] || []).map((cm) =>
        cm.id === commentId
          ? { ...cm, likedBy: cm.likedBy.includes("me") ? cm.likedBy.filter((m) => m !== "me") : [...cm.likedBy, "me"] }
          : cm
      ),
    }));
  }, []);

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
      logActivity(taskId, `Ali attached ${items.length} file${items.length > 1 ? "s" : ""}`);
    },
    [logActivity]
  );

  const removeAttachment = useCallback((taskId: string, attachmentId: string) => {
    setAttachments((a) => {
      const current = a[taskId] || [];
      const target = current.find((f) => f.id === attachmentId);
      if (target) URL.revokeObjectURL(target.url);
      return { ...a, [taskId]: current.filter((f) => f.id !== attachmentId) };
    });
  }, []);

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
  }, []);
  const markRead = useCallback((index: number) => {
    setNotifications((ns) => ns.map((n, i) => (i === index ? { ...n, unread: 0 } : n)));
  }, []);

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

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const deleteColumn = useCallback(
    (projectId: ProjectId, status: Status) => {
      const cols = customColumns[projectId] ?? COLUMNS;
      if (cols.length <= 1) {
        toast("A board needs at least one column.");
        return;
      }
      const hasTasks = tasks.some((t) => t.projectId === projectId && t.status === status);
      if (hasTasks) {
        toast("Move or delete this column's tasks first.");
        return;
      }
      setCustomColumns((c) => ({ ...c, [projectId]: cols.filter((col) => col[0] !== status) }));
    },
    [customColumns, tasks, toast]
  );

  const toggleTimer = useCallback(() => {
    setTimerRunning((running) => {
      const next = !running;
      if (tickTimer.current) clearInterval(tickTimer.current);
      if (next) {
        tickTimer.current = setInterval(() => {
          setTimerSeconds((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
      }
      return next;
    });
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
      if (total > 0) logActivity(current.taskId, `Ali tracked ${Math.round(total / 60)}m on this task`);
      return null;
    });
  }, [finalizeTracking, logActivity]);

  const setVote = useCallback((v: number) => setVoteState(v), []);
  const openDrawer = useCallback((id: string) => setOpenTaskId(id), []);
  const closeDrawer = useCallback(() => setOpenTaskId(null), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openNewTaskModal = useCallback((projectId: ProjectId, status: Status = "todo") => setNewTaskDefaults({ projectId, status }), []);
  const closeNewTaskModal = useCallback(() => setNewTaskDefaults(null), []);
  const openNewProjectModal = useCallback(() => setNewProjectOpen(true), []);
  const closeNewProjectModal = useCallback(() => setNewProjectOpen(false), []);
  const openAddColumnModal = useCallback((projectId: ProjectId) => setAddColumnProjectId(projectId), []);
  const closeAddColumnModal = useCallback(() => setAddColumnProjectId(null), []);
  const openInviteModal = useCallback(() => setInviteOpen(true), []);
  const closeInviteModal = useCallback(() => setInviteOpen(false), []);

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
        addColumnProjectId,
        openAddColumnModal,
        closeAddColumnModal,
        tasks,
        addTask,
        setTaskField,
        toggleSubtask,
        addSubtask,
        deleteTask,
        members,
        setMemberRole,
        comments,
        addComment,
        toggleCommentLike,
        activity,
        attachments,
        addAttachments,
        removeAttachment,
        notifications,
        markAllRead,
        markRead,
        daySchedule,
        scheduleTask,
        unscheduleTask,
        timerSeconds,
        timerRunning,
        toggleTimer,
        tracking,
        startTracking,
        pauseTracking,
        endTracking,
        vote,
        setVote,
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
        toastMessage,
        toast,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

const PRIORITY_LABELS: Record<"h" | "m" | "l", string> = { h: "high", m: "medium", l: "low" };

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
};

export type { Status };
