import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";
import { extractActionItems, GeminiError, geminiConfigured, sentenceToTask } from "@/lib/server/gemini";
import { PLANS, toPlan } from "@/lib/plans";

// AI text → task drafts with Google Gemini (AI-12 meeting notes, AI-25 sentence).
// Order of checks: signed in → workspace AI switched on by an Admin (opt-in,
// because the free tier may use the text to improve Google products) → Gemini key
// configured → caller may edit in that workspace → monthly cap not yet reached →
// Gemini → only THEN one assistant action is spent (use_ai_action, which re-checks
// edit rights and the cap atomically). A failed provider call costs nothing
// (AI-QUOTA-001). Only the text the user typed and the team's first names are sent.

const Body = z.object({
  workspaceId: uuid,
  action: z.enum(["meeting", "sentence"]),
  text: z.string().trim().min(3).max(8000),
});

// Same month key as use_ai_action() (date_trunc('month', now()) in UTC)
const thisMonth = () => `${new Date().toISOString().slice(0, 7)}-01`;

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  const { sb } = auth;

  const { data: settings } = await sb.from("workspace_settings").select("ai_enabled").eq("workspace_id", body.workspaceId).maybeSingle();
  if (!settings) return safeError(404);
  if (!settings.ai_enabled) return NextResponse.json({ error: "AI is turned off for this workspace" }, { status: 403 });
  if (!geminiConfigured()) return NextResponse.json({ error: "AI provider not configured" }, { status: 503 });

  // Permission before any provider call (a Viewer can't make the server call Gemini)
  const { data: canEdit } = await sb.rpc("can_edit", { ws: body.workspaceId });
  if (canEdit !== true) return safeError(403);

  // Cap before any provider call; the final, race-free check is use_ai_action() below
  const { data: ws } = await sb.from("workspaces").select("plan").eq("id", body.workspaceId).maybeSingle();
  if (!ws) return safeError(404);
  const cap = PLANS[toPlan(ws.plan as string)].aiPerMonth;
  const { data: usage } = await sb.from("ai_usage").select("used").eq("workspace_id", body.workspaceId).eq("month", thisMonth()).maybeSingle();
  if ((usage?.used ?? 0) >= cap) return NextResponse.json({ error: "AI limit reached" }, { status: 429 });

  // Team first names, so drafts can be assigned (RLS: only this workspace's members)
  const { data: rows } = await sb.from("workspace_members").select("user_id").eq("workspace_id", body.workspaceId);
  const ids = (rows ?? []).map((r) => r.user_id as string);
  const { data: profiles } = ids.length ? await sb.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const people = (profiles ?? []).map((p) => ({ id: p.id as string, first: String(p.full_name || String(p.email).split("@")[0]).split(" ")[0].slice(0, 40) }));
  const names = Array.from(new Set(people.map((p) => p.first)));
  const idFor = (name: string | null) => (name ? people.find((p) => p.first.toLowerCase() === name.toLowerCase())?.id ?? null : null);

  const today = new Date().toISOString().slice(0, 10);
  let drafts: Awaited<ReturnType<typeof extractActionItems>>;
  try {
    drafts = body.action === "meeting" ? await extractActionItems(body.text, names, today) : [await sentenceToTask(body.text, names, today)];
  } catch (e) {
    // Nothing was spent: the provider failed
    // One plain string: the dev log drops object arguments (it showed only "{}")
    console.error(`[api/ai] provider failed: ${e instanceof GeminiError ? e.message : e instanceof Error ? e.name : "unknown"}`);
    return e instanceof GeminiError && e.status === 429 ? NextResponse.json({ error: "Too many requests" }, { status: 429 }) : safeError(502);
  }

  // Successful answer → spend one action (atomic cap check in the database)
  const { error: spendErr } = await sb.rpc("use_ai_action", { ws: body.workspaceId });
  if (spendErr) return /ai limit/i.test(spendErr.message) ? NextResponse.json({ error: "AI limit reached" }, { status: 429 }) : safeError(403);

  return NextResponse.json({ tasks: drafts.map((d) => ({ ...d, assigneeId: idFor(d.assignee) })) });
}
