// Rule-based "AI" engines. Everything here is deterministic and runs locally on
// the mock data, so it costs nothing and needs no API key. Each function is the
// v0 described in docs/product/feature-audit.md; a model can replace it later.
import { HistoryItem, Member, MemberId, Priority, Task } from "@/types";
import { MODULE_CRITICALITY, MODULE_KEYWORDS } from "./mock-data";
import { tr, trList, trOr } from "@/i18n";

// Display name of a module in the language on screen (module ids stay English)
export const moduleName = (mod: string) => trOr(`module.${mod}`, mod);

const STOP = new Set(
  "a an the to of for on in at and or is are be with from by this that it as into not no yes our your my we you i ka ki ke ko hai hain se me mein par aur".split(" ")
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

// ---------- Module detection (free-features #32) ----------
export function detectModule(text: string, labels: string[] = []): string {
  const hay = (text + " " + labels.join(" ")).toLowerCase();
  let best = "General";
  let bestHits = 0;
  for (const [name, words] of Object.entries(MODULE_KEYWORDS)) {
    const hits = words.filter((w) => hay.includes(w)).length;
    if (hits > bestHits) {
      best = name;
      bestHits = hits;
    }
  }
  return best;
}

export function taskModule(t: Pick<Task, "title" | "description" | "labels" | "module">): string {
  return t.module || detectModule(t.title + " " + t.description, t.labels);
}

// ---------- Similarity / duplicates (AI-03) ----------
export function similarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => B.has(w) && inter++);
  return inter / (A.size + B.size - inter);
}

export function findDuplicates(title: string, tasks: Task[], excludeId?: string, threshold = 0.4) {
  return tasks
    .filter((t) => t.id !== excludeId)
    .map((t) => ({ task: t, score: similarity(title, t.title + " " + t.description) * 0.4 + similarity(title, t.title) * 0.6 }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ---------- Auto-prioritization + severity (AI-04) ----------
const IMPACT_WORDS = ["crash", "down", "broken", "not working", "kaam nahi", "fails", "failing", "all users", "blocked", "data loss", "security", "timeout", "cannot", "can't"];

export function autoPriority(input: { title: string; description?: string; labels?: string[]; dueOffset?: number; reports?: number }) {
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();
  const mod = detectModule(text, input.labels);
  const criticality = MODULE_CRITICALITY[mod] ?? 4;
  const impactHits = IMPACT_WORDS.filter((w) => text.includes(w));
  const impact = Math.min(10, impactHits.length * 4 + (input.labels?.includes("Bug") ? 3 : 0));
  const due = input.dueOffset ?? 7;
  const urgency = due < 0 ? 10 : due <= 1 ? 8 : due <= 3 ? 6 : due <= 7 ? 4 : 2;
  const frequency = Math.min(10, (input.reports ?? 0) * 2);
  const score = criticality * 0.4 + impact * 0.3 + urgency * 0.2 + frequency * 0.1;
  const priority: Priority = score >= 6.5 ? "h" : score >= 4 ? "m" : "l";
  const reasons = [
    tr("ai.reasonModule", { module: moduleName(mod), n: criticality }),
    impactHits.length ? tr("ai.reasonImpact", { words: impactHits.join(", ") }) : tr("ai.reasonNoImpact"),
    due < 0 ? tr("ai.reasonOverdue", { n: -due }) : tr("ai.reasonDueIn", { n: due }),
  ];
  if (input.reports) reasons.push(tr("ai.reasonReports", { n: input.reports }));
  return { priority, score: Math.round(score * 10) / 10, module: mod, reasons };
}

// ---------- Auto-tagging (AI-16) ----------
const TAG_WORDS: Record<string, string[]> = {
  mobile: ["mobile", "android", "ios", "app"],
  performance: ["slow", "performance", "timeout", "lag", "speed"],
  ui: ["ui", "design", "color", "layout", "button", "css"],
  security: ["security", "password", "auth", "token", "xss"],
  bug: ["bug", "crash", "broken", "fix", "error", "issue"],
  docs: ["docs", "documentation", "readme", "copy"],
};

export function autoTags(text: string): string[] {
  const t = text.toLowerCase();
  return Object.entries(TAG_WORDS)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([tag]) => tag);
}

// ---------- Smart Matching (AI-01) + workload (AI-02) ----------
export type MatchResult = { member: MemberId; score: number; expertise: number; open: number; capacity: number; reason: string };

export function smartMatch(
  task: Pick<Task, "title" | "description" | "labels" | "module" | "id">,
  tasks: Task[],
  history: HistoryItem[],
  members: Record<MemberId, Member>,
  capacity: Record<MemberId, number>
): { module: string; results: MatchResult[]; confidence: number } {
  const mod = taskModule(task);
  const ids = Object.keys(members) as MemberId[];
  const expertiseOf = (m: MemberId) =>
    history.filter((h) => h.assignee === m && h.module === mod).length +
    tasks.filter((t) => t.assignee === m && t.status === "done" && t.id !== task.id && taskModule(t) === mod).length;
  const maxExp = Math.max(1, ...ids.map(expertiseOf));
  const results = ids
    .filter((m) => members[m].role !== "Viewer")
    .map((m) => {
      const expertise = expertiseOf(m);
      const open = tasks.filter((t) => t.assignee === m && t.status !== "done" && t.id !== task.id).length;
      const cap = capacity[m] ?? 5;
      const availability = Math.max(0, 1 - open / cap);
      const score = (expertise / maxExp) * 0.6 + availability * 0.4;
      const reason = tr("ai.matchReason", { n: expertise, module: moduleName(mod), open, cap });
      return { member: m, score: Math.round(score * 100) / 100, expertise, open, capacity: cap, reason };
    })
    .sort((a, b) => b.score - a.score);
  const confidence = results.length > 1 ? Math.min(0.99, 0.5 + (results[0].score - results[1].score)) : 0.6;
  return { module: mod, results, confidence: Math.round(confidence * 100) / 100 };
}

export function workloadReport(tasks: Task[], members: Record<MemberId, Member>, capacity: Record<MemberId, number>, history: HistoryItem[]) {
  const ids = (Object.keys(members) as MemberId[]).filter((m) => members[m].role !== "Viewer");
  const rows = ids.map((m) => {
    const open = tasks.filter((t) => t.assignee === m && t.status !== "done");
    const cap = capacity[m] ?? 5;
    return { member: m, open: open.length, capacity: cap, utilization: Math.round((open.length / cap) * 100), tasks: open };
  });
  const suggestions: { taskId: string; from: MemberId; to: MemberId; reason: string }[] = [];
  const load: Record<string, number> = Object.fromEntries(rows.map((r) => [r.member, r.open]));
  for (const r of rows) {
    if (r.open <= r.capacity) continue;
    const movable = r.tasks
      .filter((t) => t.status !== "prog" && t.status !== "rev")
      .sort((a, b) => "hml".indexOf(b.priority) - "hml".indexOf(a.priority));
    for (const t of movable) {
      if (load[r.member] <= r.capacity) break;
      const match = smartMatch(t, tasks, history, members, capacity).results.find(
        (x) => x.member !== r.member && load[x.member] < (capacity[x.member] ?? 5)
      );
      if (!match) break;
      suggestions.push({ taskId: t.id, from: r.member, to: match.member, reason: tr("ai.rebalanceReason", { name: members[r.member].name, load: load[r.member], cap: r.capacity, reason: match.reason }) });
      load[r.member]--;
      load[match.member]++;
    }
  }
  return { rows, suggestions };
}

// ---------- Natural-language + structured search (AI-21, VIEW-11) ----------
export function parseQuery(q: string, members: Record<MemberId, Member>, me: MemberId = "me") {
  const s = q.toLowerCase().trim();
  const preds: ((t: Task, all: Task[]) => boolean)[] = [];
  const explain: string[] = [];
  const add = (label: string, p: (t: Task, all: Task[]) => boolean) => {
    explain.push(label);
    preds.push(p);
  };
  if (!s) return { match: () => true, explain };
  if (/\b(mine|my|me|mere|meri)\b|assignee\s*=\s*me/.test(s)) add(tr("ai.qAssigneeMe"), (t) => t.assignee === me);
  for (const m of Object.values(members)) {
    const first = m.name.split(" ")[0].toLowerCase();
    if (m.id !== me && new RegExp(`\\b${first}\\b`).test(s)) add(tr("ai.qAssignee", { name: m.name }), (t) => t.assignee === m.id);
  }
  if (/\b(high|urgent|p0|p1|critical)\b|priority\s*=\s*(high|h)/.test(s)) add(tr("ai.qPriority", { p: tr("priority.h") }), (t) => t.priority === "h");
  else if (/\b(medium|p2)\b|priority\s*=\s*(medium|m)/.test(s)) add(tr("ai.qPriority", { p: tr("priority.m") }), (t) => t.priority === "m");
  else if (/\b(low|p3)\b|priority\s*=\s*(low|l)/.test(s)) add(tr("ai.qPriority", { p: tr("priority.l") }), (t) => t.priority === "l");
  if (/\b(overdue|late)\b/.test(s)) add(tr("ai.qOverdue"), (t) => t.status !== "done" && t.dueOffset < 0);
  if (/\btoday\b/.test(s)) add(tr("ai.qDueToday"), (t) => t.dueOffset === 0);
  if (/\btomorrow\b/.test(s)) add(tr("ai.qDueTomorrow"), (t) => t.dueOffset === 1);
  if (/\byesterday\b/.test(s)) add(tr("ai.qDueYesterday"), (t) => t.dueOffset === -1);
  if (/\bthis week\b/.test(s)) add(tr("ai.qDueWeek"), (t) => t.dueOffset >= 0 && t.dueOffset <= 7);
  if (/\bblocked\b/.test(s)) add(tr("ai.qBlocked"), (t, all) => !!t.blockedBy && all.find((x) => x.id === t.blockedBy)?.status !== "done");
  if (/\b(pending|open|not done)\b|status\s*!=\s*done/.test(s)) add(tr("ai.qNotDone"), (t) => t.status !== "done");
  else if (/\bdone\b|status\s*=\s*done/.test(s)) add(tr("ai.qDone"), (t) => t.status === "done");
  if (/\bin progress\b/.test(s)) add(tr("ai.qInProgress"), (t) => t.status === "prog");
  const label = s.match(/#(\w+)/);
  if (label) add(tr("ai.qLabel", { label: label[1] }), (t) => t.labels.some((l) => l.toLowerCase() === label[1]));
  if (/\bbugs?\b/.test(s) && !label) add(tr("ai.qBugs"), (t) => t.labels.includes("Bug"));
  const quoted = s.match(/"([^"]+)"/);
  if (quoted) add(tr("ai.qText", { text: quoted[1] }), (t) => (t.title + t.description).toLowerCase().includes(quoted[1]));
  if (!preds.length) add(tr("ai.qText", { text: s }), (t) => (t.title + " " + t.description + " " + t.labels.join(" ")).toLowerCase().includes(s));
  return { match: (t: Task, all: Task[]) => preds.every((p) => p(t, all)), explain };
}

// ---------- Natural-language task creation (AI-25, AI-07 voice, SPEC-22 Slack) ----------
export function parseTaskText(text: string, members: Record<MemberId, Member>) {
  let rest = " " + text.trim() + " ";
  let dueOffset = 7;
  let priority: Priority | null = null;
  let assignee: MemberId | null = null;
  const take = (re: RegExp) => {
    const m = rest.match(re);
    if (m) rest = rest.replace(m[0], " ");
    return m;
  };
  if (take(/\b(today|aaj)\b/i)) dueOffset = 0;
  else if (take(/\b(tomorrow|kal)\b/i)) dueOffset = 1;
  else if (take(/\bnext week\b/i)) dueOffset = 7;
  else {
    const inDays = take(/\bin (\d+) days?\b/i);
    if (inDays) dueOffset = Number(inDays[1]);
    const day = take(/\b(on )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (day) {
      const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const target = names.indexOf(day[2].toLowerCase());
      const todayIdx = 2; // mock "today" is Tuesday 29 Sep 2026
      dueOffset = (target - todayIdx + 7) % 7 || 7;
    }
  }
  const pr = take(/\b(high|urgent|p0|p1|medium|p2|low|p3)( priority)?\b/i);
  if (pr) priority = /high|urgent|p0|p1/i.test(pr[1]) ? "h" : /medium|p2/i.test(pr[1]) ? "m" : "l";
  for (const m of Object.values(members)) {
    const first = m.name.split(" ")[0];
    if (take(new RegExp(`(\\b(for|to|assign to|assign)\\s+|@)${first}\\b`, "i"))) assignee = m.id;
  }
  const bug = /\b(bug|fix|crash|broken)\b/i.test(text);
  const title = rest
    .replace(/^\s*(create|add|new)\s+(bug|task)\s*:?\s*/i, " ")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const cleanTitle = title.charAt(0).toUpperCase() + title.slice(1);
  const ap = autoPriority({ title: cleanTitle, labels: bug ? ["Bug"] : [], dueOffset });
  return {
    title: cleanTitle,
    dueOffset,
    priority: priority ?? ap.priority,
    assignee,
    labels: bug ? ["Bug"] : autoTags(cleanTitle).slice(0, 1).map((t) => t[0].toUpperCase() + t.slice(1)),
    module: ap.module,
    priorityReason: priority ? tr("ai.fromWords") : tr("ai.auto", { reason: ap.reasons[0] }),
  };
}

// ---------- Next best action (AI-19) ----------
export function nextActions(tasks: Task[], me: MemberId = "me") {
  const out: { taskId: string; text: string; why: string }[] = [];
  const mine = tasks.filter((t) => t.assignee === me && t.status !== "done");
  mine
    .filter((t) => t.dueOffset < 0)
    .forEach((t) => out.push({ taskId: t.id, text: tr("ai.naFinish", { title: t.title }), why: tr("ai.whyOverdue", { n: -t.dueOffset }) }));
  mine
    .filter((t) => t.dueOffset >= 0 && t.dueOffset <= 1)
    .forEach((t) => out.push({ taskId: t.id, text: tr("ai.naComplete", { title: t.title }), why: t.dueOffset === 0 ? tr("ai.whyToday") : tr("ai.whyTomorrow") }));
  tasks
    .filter((t) => t.blockedBy && tasks.find((b) => b.id === t.blockedBy && b.assignee === me && b.status !== "done"))
    .forEach((t) => {
      const blocker = tasks.find((b) => b.id === t.blockedBy)!;
      out.push({ taskId: blocker.id, text: tr("ai.naUnblock", { title: t.title }), why: tr("ai.whyWaits", { title: blocker.title }) });
    });
  tasks
    .filter((t) => t.status === "rev" && t.assignee !== me)
    .forEach((t) => out.push({ taskId: t.id, text: tr("ai.naReview", { title: t.title }), why: tr("ai.whyReview") }));
  const seen = new Set<string>();
  return out.filter((x) => !seen.has(x.taskId) && seen.add(x.taskId)).slice(0, 5);
}

// ---------- Task splitting (AI-23) ----------
export function splitTask(title: string): string[] {
  const t = title.toLowerCase();
  if (/\b(bug|fix|crash|broken|error)\b/.test(t)) return trList("ai.split.bug");
  if (/\b(design|wireframe|layout|hero|ui)\b/.test(t)) return trList("ai.split.design");
  if (/\b(email|copy|blog|press|content|announcement)\b/.test(t)) return trList("ai.split.content");
  if (/\b(launch|rollout|release)\b/.test(t)) return trList("ai.split.launch");
  return trList("ai.split.default");
}

// ---------- Test case generator (AI-14) ----------
export function testCases(title: string): string[] {
  const t = title.toLowerCase();
  const subject = title.replace(/^(fix|build|create|add)\s+/i, "");
  if (/login|auth|password|biometric/.test(t))
    return trList("ai.tests.login");
  if (/payment|checkout|refund/.test(t))
    return trList("ai.tests.payment");
  if (/form/.test(t)) return trList("ai.tests.form");
  return trList("ai.tests.generic", { subject });
}

// ---------- Auto-documentation (AI-20) ----------
export function autoDoc(task: Task, projectName: string, moduleName: string): string {
  const subs = task.subtasks.map((s) => `- ${s[1] ? "[x]" : "[ ]"} ${s[0]}`).join("\n") || `- ${tr("ai.doc.none")}`;
  return `## ${task.title}\n\n**${tr("ai.doc.project")}:** ${projectName} · **${tr("ai.doc.module")}:** ${moduleName}\n\n${task.description || tr("ai.doc.noDesc")}\n\n### ${tr("ai.doc.steps")}\n${subs}\n\n### ${tr("ai.doc.tests")}\n${testCases(task.title)
    .map((c) => `- ${c}`)
    .join("\n")}\n`;
}

// ---------- Eisenhower matrix (AI-24) ----------
export function eisenhower(tasks: Task[]) {
  const open = tasks.filter((t) => t.status !== "done");
  const urgent = (t: Task) => t.dueOffset <= 2;
  const important = (t: Task) => t.priority !== "l";
  return {
    doNow: open.filter((t) => urgent(t) && important(t)),
    schedule: open.filter((t) => !urgent(t) && important(t)),
    delegate: open.filter((t) => urgent(t) && !important(t)),
    eliminate: open.filter((t) => !urgent(t) && !important(t)),
  };
}

// ---------- Estimates & prediction (AI-18, TIME-02) ----------
export function estimateFor(task: Task, history: HistoryItem[]): number {
  if (task.estimateHours) return task.estimateHours;
  const same = history.filter((h) => h.module === taskModule(task));
  if (!same.length) return task.lengthDays;
  return Math.round(same.reduce((s, h) => s + h.actualHours, 0) / same.length);
}

export function predictCompletion(task: Task, tasks: Task[], history: HistoryItem[]) {
  if (task.status === "done") return { predictedOffset: task.dueOffset, late: false, confidence: 1, risks: [] as string[] };
  const est = estimateFor(task, history);
  const doneRatio = task.subtasks.length ? task.subtasks.filter((s) => s[1]).length / task.subtasks.length : task.status === "rev" ? 0.8 : task.status === "prog" ? 0.4 : 0;
  const remainingHours = Math.max(0.5, est * (1 - doneRatio));
  const load = tasks.filter((t) => t.assignee === task.assignee && t.status !== "done").length;
  const hoursPerDay = Math.max(1, 6 / Math.max(1, load));
  const risks: string[] = [];
  let waitDays = 0;
  const blocker = task.blockedBy ? tasks.find((t) => t.id === task.blockedBy) : undefined;
  if (blocker && blocker.status !== "done") {
    risks.push(tr("ai.riskBlockedBy", { title: blocker.title }));
    waitDays = Math.max(0, blocker.dueOffset);
  }
  if (load > 4) risks.push(tr("ai.riskLoad", { n: load }));
  const mod = taskModule(task);
  const past = history.filter((h) => h.module === mod);
  const overrun = past.length ? past.reduce((s, h) => s + h.actualHours / h.estimateHours, 0) / past.length : 1;
  if (overrun > 1.2) risks.push(tr("ai.riskOverrun", { module: moduleName(mod), n: Math.round((overrun - 1) * 100) }));
  const predictedOffset = Math.ceil(waitDays + (remainingHours * overrun) / hoursPerDay);
  const late = predictedOffset > task.dueOffset;
  if (task.dueOffset < 0) risks.push(tr("ai.riskOverdue"));
  const confidence = Math.max(0.4, Math.min(0.9, 0.85 - risks.length * 0.1));
  return { predictedOffset, late, confidence: Math.round(confidence * 100) / 100, risks };
}

// ---------- Dependency detection (AI-13) ----------
const UPSTREAM = /\b(api|endpoint|backend|server|schema|design|wireframe|spec|contract)\b/i;

export function detectDependencies(tasks: Task[]) {
  const out: { from: Task; to: Task; reason: string }[] = [];
  const open = tasks.filter((t) => t.status !== "done");
  for (const a of open)
    for (const b of open) {
      if (a.id === b.id || a.projectId !== b.projectId || b.blockedBy) continue;
      if (!UPSTREAM.test(a.title + " " + a.description) || UPSTREAM.test(b.title)) continue;
      const shared = tokens(a.title).filter((w) => tokens(b.title + " " + b.description).includes(w) && !UPSTREAM.test(w));
      const sameModule = taskModule(a) === taskModule(b) && taskModule(a) !== "General";
      if (shared.length || sameModule)
        out.push({ from: a, to: b, reason: shared.length ? tr("ai.depShared", { word: shared[0] }) : tr("ai.depModule", { module: moduleName(taskModule(a)), title: a.title }) });
    }
  return out.slice(0, 6);
}

// ---------- Scheduling & allocation (AI-17, AI-26, SPEC-27, TIME-11) ----------
export function autoSchedule(tasks: Task[], history: HistoryItem[], hoursPerDay = 6) {
  const open = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => "hml".indexOf(a.priority) - "hml".indexOf(b.priority) || a.dueOffset - b.dueOffset);
  let cursor = 0;
  return open.map((t) => {
    const hours = estimateFor(t, history);
    const start = Math.floor(cursor / hoursPerDay);
    cursor += hours;
    const end = Math.ceil(cursor / hoursPerDay);
    return { task: t, hours, startOffset: start, endOffset: end, late: end > t.dueOffset };
  });
}

export function sprintPlan(tasks: Task[], history: HistoryItem[], teamSize: number, sprintDays = 10, holidays = 0) {
  const velocityHours = history.filter((h) => h.completedDaysAgo <= 14).reduce((s, h) => s + h.actualHours, 0);
  const raw = teamSize * 6 * (sprintDays - holidays);
  const capacity = Math.min(raw, Math.round(velocityHours * 1.1) || raw);
  const plan: { task: Task; hours: number }[] = [];
  let used = 0;
  for (const t of tasks
    .filter((t) => t.status === "todo")
    .sort((a, b) => "hml".indexOf(a.priority) - "hml".indexOf(b.priority) || a.dueOffset - b.dueOffset)) {
    const hours = estimateFor(t, history);
    if (used + hours > capacity) continue;
    used += hours;
    plan.push({ task: t, hours });
  }
  return { raw, velocityHours, capacity, used, plan };
}

// ---------- Insights, retro, reports (AI-27, AI-28, ANL-12, NOTIF-05, NOTIF-06) ----------
export function boardInsights(tasks: Task[], history: HistoryItem[], members: Record<MemberId, Member>) {
  const out: string[] = [];
  const bugs = [...tasks.filter((t) => t.labels.includes("Bug")).map((t) => taskModule(t)), ...history.filter((h) => h.priority === "h").map((h) => h.module)];
  const counts: Record<string, number> = {};
  bugs.forEach((m) => (counts[m] = (counts[m] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top) out.push(tr("ai.insTopModule", { module: moduleName(top[0]), pct: Math.round((top[1] / bugs.length) * 100) }));
  const byPerson: Record<string, number> = {};
  history.filter((h) => h.completedDaysAgo <= 14).forEach((h) => (byPerson[h.assignee] = (byPerson[h.assignee] || 0) + 1));
  const best = Object.entries(byPerson).sort((a, b) => b[1] - a[1])[0];
  if (best) out.push(tr("ai.insBest", { name: members[best[0] as MemberId].name, n: best[1] }));
  const recent = history.filter((h) => h.completedDaysAgo <= 12);
  const older = history.filter((h) => h.completedDaysAgo > 12);
  const avg = (xs: HistoryItem[]) => (xs.length ? xs.reduce((s, h) => s + (h.startedDaysAgo - h.completedDaysAgo), 0) / xs.length : 0);
  if (recent.length && older.length) {
    const a = avg(older);
    const b = avg(recent);
    out.push(tr("ai.insCycle", { a: a.toFixed(1), b: b.toFixed(1), trend: b <= a ? tr("ai.better") : tr("ai.worse") }));
  }
  const blocked = tasks.filter((t) => t.blockedBy && tasks.find((x) => x.id === t.blockedBy)?.status !== "done");
  if (blocked.length) out.push(tr("ai.insBlocked", { n: blocked.length }));
  return out;
}

export function processImprovements(tasks: Task[], history: HistoryItem[]) {
  const out: string[] = [];
  const acc = estimateAccuracy(history);
  if (acc < 85) out.push(tr("ai.impEstimates", { n: acc }));
  const inReview = tasks.filter((t) => t.status === "rev").length;
  if (inReview >= 2) out.push(tr("ai.impReview", { n: inReview }));
  const overdue = tasks.filter((t) => t.status !== "done" && t.dueOffset < 0).length;
  if (overdue) out.push(tr("ai.impOverdue", { n: overdue }));
  const bugShare = tasks.filter((t) => t.labels.includes("Bug") && t.status !== "done").length / Math.max(1, tasks.length);
  if (bugShare > 0.1) out.push(tr("ai.impBugs", { n: Math.round(bugShare * 100) }));
  if (!out.length) out.push(tr("ai.impNone"));
  return out;
}

export function estimateAccuracy(history: HistoryItem[]): number {
  if (!history.length) return 100;
  const acc = history.reduce((s, h) => s + Math.min(h.estimateHours, h.actualHours) / Math.max(h.estimateHours, h.actualHours), 0) / history.length;
  return Math.round(acc * 100);
}

export function retrospective(tasks: Task[], history: HistoryItem[], sprintDays = 14) {
  const done = history.filter((h) => h.completedDaysAgo <= sprintDays);
  const target = Math.max(1, Math.round(done.length * 0.85));
  const overran = done.filter((h) => h.actualHours >= h.estimateHours * 1.5);
  const highDone = done.filter((h) => h.priority === "h").length;
  const blocked = tasks.filter((t) => t.blockedBy && tasks.find((x) => x.id === t.blockedBy)?.status !== "done");
  return {
    wentWell: [tr("ai.retroResolved", { n: done.length, target }), tr("ai.retroHigh", { n: highDone }), tr("ai.retroAccuracy", { n: estimateAccuracy(done) })],
    improve: [
      overran.length ? tr("ai.retroOverran", { n: overran.length, titles: overran.map((h) => h.title).slice(0, 2).join(", ") }) : tr("ai.retroNoOverrun"),
      blocked.length ? tr("ai.retroBlocked", { n: blocked.length }) : tr("ai.retroNothingBlocked"),
    ],
    actions: processImprovements(tasks, history).slice(0, 3),
    lessons: [
      overran.length ? tr("ai.lessonHarder", { module: moduleName(overran[0].module) }) : tr("ai.lessonHeld"),
      tr("ai.lessonSplit"),
    ],
  };
}

export function standupSummary(tasks: Task[], members: Record<MemberId, Member>) {
  return (Object.keys(members) as MemberId[])
    .filter((m) => members[m].role !== "Viewer")
    .map((m) => {
      const mine = tasks.filter((t) => t.assignee === m);
      return {
        member: m,
        done: mine.filter((t) => t.status === "done" && t.createdDaysAgo <= 12).map((t) => t.title),
        doing: mine.filter((t) => t.status === "prog" || t.status === "rev").map((t) => t.title),
        blocked: mine.filter((t) => t.blockedBy && tasks.find((x) => x.id === t.blockedBy)?.status !== "done").map((t) => t.title),
      };
    });
}

// ---------- Meeting notes / email → tasks (AI-12, INT-01) ----------
const ACTION = /\b(fix|build|send|prepare|write|review|update|create|call|schedule|demo|deploy|test|design|share|finish|karna|bhejo|banao)\b/i;

export function meetingToActions(notes: string, members: Record<MemberId, Member>) {
  return notes
    .split(/\n|(?<=[.!?])\s+/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((l) => l.length > 4 && ACTION.test(l))
    .map((line) => ({ line, ...parseTaskText(line, members) }));
}

// ---------- Wellbeing (ANL-08) & skill gap (ANL-11) ----------
export function wellbeing(tasks: Task[], members: Record<MemberId, Member>, capacity: Record<MemberId, number>, survey: Partial<Record<MemberId, number>>) {
  return (Object.keys(members) as MemberId[])
    .filter((m) => members[m].role !== "Viewer")
    .map((m) => {
      const open = tasks.filter((t) => t.assignee === m && t.status !== "done");
      const overdue = open.filter((t) => t.dueOffset < 0).length;
      const workload = Math.max(0, 100 - Math.max(0, open.length - (capacity[m] ?? 5)) * 25);
      const delivery = Math.max(0, 100 - overdue * 30);
      const sat = survey[m] !== undefined ? (4 - (survey[m] as number)) * 25 + 25 : 70;
      const score = Math.round(workload * 0.4 + delivery * 0.3 + sat * 0.3);
      const risk = score >= 75 ? "Low" : score >= 55 ? "Medium" : "High";
      const suggestion = risk === "High" ? tr("ai.wbReduce", { name: members[m].name.split(" ")[0], n: Math.max(1, open.length - (capacity[m] ?? 5)) }) : risk === "Medium" ? tr("ai.wbCheckIn") : tr("ai.wbHealthy");
      return { member: m, score, risk, workload, delivery, sat, suggestion };
    });
}

export function skillGaps(history: HistoryItem[], members: Record<MemberId, Member>) {
  const modules = Array.from(new Set(history.map((h) => h.module)));
  return modules
    .map((mod) => {
      const people = Array.from(new Set(history.filter((h) => h.module === mod).map((h) => h.assignee)));
      const items = history.filter((h) => h.module === mod);
      const overrun = items.reduce((s, h) => s + h.actualHours / h.estimateHours, 0) / items.length;
      return { module: mod, experts: people.map((p) => members[p].name), busFactor: people.length, overrun: Math.round(overrun * 100) };
    })
    .sort((a, b) => a.busFactor - b.busFactor || b.overrun - a.overrun);
}
