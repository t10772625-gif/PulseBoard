import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";
import { MAX_DELIVERIES_PER_MINUTE, postToChat, postToRuleUrl, recentDeliveries } from "@/lib/server/deliver";
import { pushToPeople } from "@/lib/server/push";

// Something happened to a task → tell the outside world:
//   * Slack / Discord channels connected to the workspace (for that event)
//   * automation rules whose action is "webhook" (signed POST to the rule's URL)
//   * a browser push to the assignee when a task is assigned to someone else
// The app calls this after the change is saved. The server re-reads the task as the
// caller (RLS: must be a member) and checks the event really matches the task, so a
// member can't make channels announce things that didn't happen. Rate limit: 30
// deliveries per member per minute.

const EVENTS = ["task.created", "task.done", "task.high", "task.assigned", "task.overdue"] as const;
const RULE_TRIGGER: Record<(typeof EVENTS)[number], string> = {
  "task.created": "created",
  "task.done": "status_done",
  "task.high": "priority_high",
  "task.assigned": "assigned",
  "task.overdue": "overdue",
};

const Body = z.object({ workspaceId: uuid, taskId: uuid, event: z.enum(EVENTS) });

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  const { sb, user } = auth;

  const recent = await recentDeliveries(sb, user.id);
  if (recent === null) return safeError(500); // fail closed: limit can't be checked
  if (recent >= MAX_DELIVERIES_PER_MINUTE) return safeError(429);

  const { data: task } = await sb
    .from("tasks")
    .select("id, workspace_id, project_id, number, title, status, priority, assignee_id, due_date, created_at, deleted_at")
    .eq("id", body.taskId)
    .eq("workspace_id", body.workspaceId)
    .maybeSingle();
  if (!task || task.deleted_at) return safeError(404);

  const today = new Date().toISOString().slice(0, 10);
  const real =
    (body.event === "task.created" && Date.now() - new Date(task.created_at).getTime() < 10 * 60_000) ||
    (body.event === "task.done" && task.status === "done") ||
    (body.event === "task.high" && task.priority === "h") ||
    (body.event === "task.assigned" && !!task.assignee_id) ||
    (body.event === "task.overdue" && task.status !== "done" && !!task.due_date && task.due_date < today);
  if (!real) return safeError(400);

  const { data: project } = await sb.from("projects").select("name").eq("id", task.project_id).maybeSingle();
  const { data: ws } = await sb.from("workspaces").select("task_prefix").eq("id", body.workspaceId).maybeSingle();
  const { data: me } = await sb.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
  const actor = String(me?.full_name || String(me?.email ?? "Someone").split("@")[0]).split(" ")[0];
  const key = ws?.task_prefix && task.number ? `${ws.task_prefix}-${task.number}` : "";
  const title = String(task.title).slice(0, 150);
  const label = `${key ? key + " " : ""}“${title}”`;
  const text =
    body.event === "task.created"
      ? `🆕 ${actor} created ${label} on ${project?.name ?? "a board"}`
      : body.event === "task.done"
        ? `✅ ${actor} finished ${label}`
        : body.event === "task.high"
          ? `🔥 ${label} is now high priority`
          : body.event === "task.assigned"
            ? `👤 ${actor} assigned ${label}`
            : `⏰ ${label} is overdue`;
  const origin = new URL(req.url).origin;
  const link = `${origin}/projects/${task.project_id}`;

  // Chat channels that asked for this event
  const { data: hooks } = await sb.from("workspace_webhooks").select("id, kind, url_enc, url_hint, events, active").eq("workspace_id", body.workspaceId).eq("active", true);
  let chat = 0;
  for (const h of (hooks ?? []).filter((x) => (x.events as string[]).includes(body.event)).slice(0, 5)) {
    const status = await postToChat(sb, body.workspaceId, h as never, body.event, text, link);
    if (status >= 200 && status < 300) chat++;
  }

  // Automation rules with a webhook action for this trigger (RLS decides which rules this member can see)
  const { data: rules } = await sb.from("automation_rules").select("id, param").eq("workspace_id", body.workspaceId).eq("active", true).eq("action", "webhook").eq("trigger", RULE_TRIGGER[body.event]);
  let ruleHits = 0;
  for (const r of (rules ?? []).slice(0, 5)) {
    if (!r.param) continue;
    const status = await postToRuleUrl(sb, body.workspaceId, r.id as string, r.param as string, body.event, {
      event: body.event,
      sent_at: new Date().toISOString(),
      task: { id: task.id, key, title, status: task.status, priority: task.priority, board: project?.name ?? "", due_date: task.due_date },
    });
    if (status >= 200 && status < 300) ruleHits++;
  }

  // Browser push to the new assignee (not to yourself)
  let pushed = 0;
  if (body.event === "task.assigned" && task.assignee_id && task.assignee_id !== user.id) {
    pushed = await pushToPeople(sb, body.workspaceId, [task.assignee_id as string], "PulseBoard", `${actor} assigned you ${label}`, `/projects/${task.project_id}`);
  }

  return NextResponse.json({ chat, rules: ruleHits, push: pushed });
}
