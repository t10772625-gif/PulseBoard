// Rule-based "AI" engines. Everything here is deterministic and runs locally on
// the mock data, so it costs nothing and needs no API key. Each function is the
// v0 described in docs/product/feature-audit.md; a model can replace it later.
import { HistoryItem, Member, MemberId, Priority, Task } from "@/types";
import { MODULE_CRITICALITY, MODULE_KEYWORDS } from "./mock-data";

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
    `${mod} module (criticality ${criticality}/10)`,
    impactHits.length ? `impact words: ${impactHits.join(", ")}` : "no impact words found",
    due < 0 ? `${-due}d overdue` : `due in ${due}d`,
  ];
  if (input.reports) reasons.push(`${input.reports} similar reports`);
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
      const reason = `${expertise} ${mod} task${expertise === 1 ? "" : "s"} done · ${open}/${cap} open`;
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
      suggestions.push({ taskId: t.id, from: r.member, to: match.member, reason: `${members[r.member].name} is at ${load[r.member]}/${r.capacity}; ${match.reason}` });
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
  if (/\b(mine|my|me|mere|meri)\b|assignee\s*=\s*me/.test(s)) add("assignee = me", (t) => t.assignee === me);
  for (const m of Object.values(members)) {
    const first = m.name.split(" ")[0].toLowerCase();
    if (m.id !== me && new RegExp(`\\b${first}\\b`).test(s)) add(`assignee = ${m.name}`, (t) => t.assignee === m.id);
  }
  if (/\b(high|urgent|p0|p1|critical)\b|priority\s*=\s*(high|h)/.test(s)) add("priority = high", (t) => t.priority === "h");
  else if (/\b(medium|p2)\b|priority\s*=\s*(medium|m)/.test(s)) add("priority = medium", (t) => t.priority === "m");
  else if (/\b(low|p3)\b|priority\s*=\s*(low|l)/.test(s)) add("priority = low", (t) => t.priority === "l");
  if (/\b(overdue|late)\b/.test(s)) add("overdue", (t) => t.status !== "done" && t.dueOffset < 0);
  if (/\btoday\b/.test(s)) add("due today", (t) => t.dueOffset === 0);
  if (/\btomorrow\b/.test(s)) add("due tomorrow", (t) => t.dueOffset === 1);
  if (/\byesterday\b/.test(s)) add("due yesterday", (t) => t.dueOffset === -1);
  if (/\bthis week\b/.test(s)) add("due within 7 days", (t) => t.dueOffset >= 0 && t.dueOffset <= 7);
  if (/\bblocked\b/.test(s)) add("blocked", (t, all) => !!t.blockedBy && all.find((x) => x.id === t.blockedBy)?.status !== "done");
  if (/\b(pending|open|not done)\b|status\s*!=\s*done/.test(s)) add("status ≠ done", (t) => t.status !== "done");
  else if (/\bdone\b|status\s*=\s*done/.test(s)) add("status = done", (t) => t.status === "done");
  if (/\bin progress\b/.test(s)) add("status = in progress", (t) => t.status === "prog");
  const label = s.match(/#(\w+)/);
  if (label) add(`label = ${label[1]}`, (t) => t.labels.some((l) => l.toLowerCase() === label[1]));
  if (/\bbugs?\b/.test(s) && !label) add("label = Bug", (t) => t.labels.includes("Bug"));
  const quoted = s.match(/"([^"]+)"/);
  if (quoted) add(`text contains "${quoted[1]}"`, (t) => (t.title + t.description).toLowerCase().includes(quoted[1]));
  if (!preds.length) add(`text contains "${s}"`, (t) => (t.title + " " + t.description + " " + t.labels.join(" ")).toLowerCase().includes(s));
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
    priorityReason: priority ? "from your words" : `auto: ${ap.reasons[0]}`,
  };
}

// ---------- Next best action (AI-19) ----------
export function nextActions(tasks: Task[], me: MemberId = "me") {
  const out: { taskId: string; text: string; why: string }[] = [];
  const mine = tasks.filter((t) => t.assignee === me && t.status !== "done");
  mine
    .filter((t) => t.dueOffset < 0)
    .forEach((t) => out.push({ taskId: t.id, text: `Finish "${t.title}"`, why: `${-t.dueOffset}d overdue` }));
  mine
    .filter((t) => t.dueOffset >= 0 && t.dueOffset <= 1)
    .forEach((t) => out.push({ taskId: t.id, text: `Complete "${t.title}"`, why: t.dueOffset === 0 ? "due today" : "due tomorrow" }));
  tasks
    .filter((t) => t.blockedBy && tasks.find((b) => b.id === t.blockedBy && b.assignee === me && b.status !== "done"))
    .forEach((t) => {
      const blocker = tasks.find((b) => b.id === t.blockedBy)!;
      out.push({ taskId: blocker.id, text: `Unblock "${t.title}"`, why: `it waits on your task "${blocker.title}"` });
    });
  tasks
    .filter((t) => t.status === "rev" && t.assignee !== me)
    .forEach((t) => out.push({ taskId: t.id, text: `Review "${t.title}"`, why: "waiting in review" }));
  const seen = new Set<string>();
  return out.filter((x) => !seen.has(x.taskId) && seen.add(x.taskId)).slice(0, 5);
}

// ---------- Task splitting (AI-23) ----------
export function splitTask(title: string): string[] {
  const t = title.toLowerCase();
  if (/\b(bug|fix|crash|broken|error)\b/.test(t)) return ["Reproduce and write steps", "Find the root cause", "Fix it", "Add a regression test", "Verify on staging"];
  if (/\b(design|wireframe|layout|hero|ui)\b/.test(t)) return ["Gather references", "Wireframe", "High-fidelity design", "Review with team", "Hand off to dev"];
  if (/\b(email|copy|blog|press|content|announcement)\b/.test(t)) return ["Outline", "First draft", "Edit", "Legal / brand review", "Publish"];
  if (/\b(launch|rollout|release)\b/.test(t)) return ["Checklist", "Stakeholder sign-off", "Staged rollout", "Monitor metrics", "Retro"];
  return ["Plan the approach", "Build", "Write tests", "Code review", "Deploy"];
}

// ---------- Test case generator (AI-14) ----------
export function testCases(title: string): string[] {
  const t = title.toLowerCase();
  const subject = title.replace(/^(fix|build|create|add)\s+/i, "");
  if (/login|auth|password|biometric/.test(t))
    return ["Login with valid credentials → succeeds", "Login with invalid credentials → shows an error", "Login on a slow network → times out gracefully after 30s", "Login from mobile → works", "Repeated failures → rate limited"];
  if (/payment|checkout|refund/.test(t))
    return ["Successful payment → order confirmed", "Declined card → clear error, no charge", "Gateway timeout → retry without double charge", "Refund → balance restored"];
  if (/form/.test(t)) return ["Submit with all fields → success", "Missing required field → inline error", "Invalid email → rejected", "Double submit → only one entry"];
  return [`${subject}: happy path works`, `${subject}: invalid input is rejected`, `${subject}: works on mobile`, `${subject}: no regression in related screens`];
}

// ---------- Auto-documentation (AI-20) ----------
export function autoDoc(task: Task, projectName: string, moduleName: string): string {
  const subs = task.subtasks.map((s) => `- ${s[1] ? "[x]" : "[ ]"} ${s[0]}`).join("\n") || "- (none)";
  return `## ${task.title}\n\n**Project:** ${projectName} · **Module:** ${moduleName}\n\n${task.description || "_No description provided._"}\n\n### Steps\n${subs}\n\n### Tests\n${testCases(task.title)
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
    risks.push(`blocked by "${blocker.title}"`);
    waitDays = Math.max(0, blocker.dueOffset);
  }
  if (load > 4) risks.push(`assignee has ${load} open tasks`);
  const mod = taskModule(task);
  const past = history.filter((h) => h.module === mod);
  const overrun = past.length ? past.reduce((s, h) => s + h.actualHours / h.estimateHours, 0) / past.length : 1;
  if (overrun > 1.2) risks.push(`${mod} tasks usually run ${Math.round((overrun - 1) * 100)}% over estimate`);
  const predictedOffset = Math.ceil(waitDays + (remainingHours * overrun) / hoursPerDay);
  const late = predictedOffset > task.dueOffset;
  if (task.dueOffset < 0) risks.push("already overdue");
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
        out.push({ from: a, to: b, reason: shared.length ? `both mention "${shared[0]}"` : `same module (${taskModule(a)}) and "${a.title}" looks upstream` });
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
  if (top) out.push(`${top[0]} has ${Math.round((top[1] / bugs.length) * 100)}% of high-priority work and bugs → strengthen code review and tests there.`);
  const byPerson: Record<string, number> = {};
  history.filter((h) => h.completedDaysAgo <= 14).forEach((h) => (byPerson[h.assignee] = (byPerson[h.assignee] || 0) + 1));
  const best = Object.entries(byPerson).sort((a, b) => b[1] - a[1])[0];
  if (best) out.push(`${members[best[0] as MemberId].name} completed ${best[1]} tasks in the last 2 weeks → send appreciation.`);
  const recent = history.filter((h) => h.completedDaysAgo <= 12);
  const older = history.filter((h) => h.completedDaysAgo > 12);
  const avg = (xs: HistoryItem[]) => (xs.length ? xs.reduce((s, h) => s + (h.startedDaysAgo - h.completedDaysAgo), 0) / xs.length : 0);
  if (recent.length && older.length) {
    const a = avg(older);
    const b = avg(recent);
    out.push(`Average cycle time went from ${a.toFixed(1)}d to ${b.toFixed(1)}d (${b <= a ? "better" : "worse"}).`);
  }
  const blocked = tasks.filter((t) => t.blockedBy && tasks.find((x) => x.id === t.blockedBy)?.status !== "done");
  if (blocked.length) out.push(`${blocked.length} task${blocked.length > 1 ? "s are" : " is"} blocked → unblock within 24 hours.`);
  return out;
}

export function processImprovements(tasks: Task[], history: HistoryItem[]) {
  const out: string[] = [];
  const acc = estimateAccuracy(history);
  if (acc < 85) out.push(`Estimates are ${acc}% accurate → add a 20% buffer for complex tasks.`);
  const inReview = tasks.filter((t) => t.status === "rev").length;
  if (inReview >= 2) out.push(`${inReview} tasks waiting in review → aim for review within 1 day.`);
  const overdue = tasks.filter((t) => t.status !== "done" && t.dueOffset < 0).length;
  if (overdue) out.push(`${overdue} overdue tasks → hold a 15-minute daily triage until it's zero.`);
  const bugShare = tasks.filter((t) => t.labels.includes("Bug") && t.status !== "done").length / Math.max(1, tasks.length);
  if (bugShare > 0.1) out.push(`Open bugs are ${Math.round(bugShare * 100)}% of the board → raise test automation before new features.`);
  if (!out.length) out.push("No process issues detected this sprint.");
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
    wentWell: [`${done.length} tasks resolved (target ${target})`, `${highDone} high-priority items closed`, `Estimate accuracy ${estimateAccuracy(done)}%`],
    improve: [
      overran.length ? `${overran.length} tasks took 1.5x+ their estimate (${overran.map((h) => h.title).slice(0, 2).join(", ")})` : "No big estimate overruns",
      blocked.length ? `${blocked.length} tasks still blocked` : "Nothing blocked",
    ],
    actions: processImprovements(tasks, history).slice(0, 3),
    lessons: [
      overran.length ? `${overran[0].module} work is harder than it looks; estimate it higher.` : "Estimates held up this sprint.",
      "Keep splitting large tasks into subtasks; tasks with subtasks finished faster.",
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
      const suggestion = risk === "High" ? `Reduce ${members[m].name.split(" ")[0]}'s load by ${Math.max(1, open.length - (capacity[m] ?? 5))} task(s)` : risk === "Medium" ? "Check in this week" : "Healthy";
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
