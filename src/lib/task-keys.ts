import type { Task } from "@/types";

// Readable task ids ("PB-123"): <workspace task prefix>-<task number>. The number
// counts up inside the workspace and never changes; the uuid stays the real id.
// In real mode the database hands out both (migration 22_task-keys); demo mode
// mirrors the same rules.

export const PREFIX_PATTERN = /^[A-Z][A-Z0-9]{1,5}$/;

// Same algorithm as public.suggest_task_prefix(): initials of the first words
// ("Pulse Board" → "PB"), or the first letters of one word ("Northwind" → "NOR");
// a trailing "workspace" (the sign-up default name) doesn't count; "PB" otherwise.
export function suggestPrefix(name: string): string {
  let words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words[words.length - 1] === "WORKSPACE") words = words.slice(0, -1);
  let base = words.length >= 2 ? words.slice(0, 4).map((w) => w[0]).join("") : (words[0] ?? "").slice(0, 3);
  base = base.replace(/^[0-9]+/, "");
  return base.length < 2 ? "PB" : base.slice(0, 6);
}

export function taskKey(task: Pick<Task, "number">, prefix: string): string {
  return prefix && task.number ? `${prefix}-${task.number}` : "";
}

// Next free number in the workspace (demo mode only; the database does this in real mode)
export function nextTaskNumber(tasks: Task[]): number {
  return tasks.reduce((max, t) => (t.number ? Math.max(max, t.number) : max), 0) + 1;
}

// Number demo tasks in list order
export function withDemoNumbers(tasks: Task[]): Task[] {
  let n = 0;
  return tasks.map((t) => (t.number ? t : { ...t, number: ++n }));
}

// "PB-123" (or just "123") typed in search → the task it names
export function findByKey(query: string, tasks: Task[], prefix: string): Task | undefined {
  const m = query.trim().toUpperCase().match(/^(?:([A-Z][A-Z0-9]{1,5})-)?(\d+)$/);
  if (!m || (m[1] && m[1] !== prefix)) return undefined;
  return tasks.find((t) => t.number === Number(m[2]));
}
