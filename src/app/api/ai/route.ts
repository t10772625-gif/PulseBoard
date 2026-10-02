import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";
import { extractActionItems, GeminiError, geminiConfigured, sentenceToTask } from "@/lib/server/gemini";

// AI text → task drafts with Google Gemini (AI-12 meeting notes, AI-25 sentence).
// Order of checks: signed in → workspace AI switched on by an Admin (opt-in,
// because the free tier may use the text to improve Google products) → Gemini key
// configured → one assistant action spent against the plan's monthly cap
// (use_ai_action, which also checks the caller can edit in that workspace).
// Only the text the user typed and the team's first names are sent.

const Body = z.object({
  workspaceId: uuid,
  action: z.enum(["meeting", "sentence"]),
  text: z.string().trim().min(3).max(8000),
});

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

  const { error: spendErr } = await sb.rpc("use_ai_action", { ws: body.workspaceId });
  if (spendErr) return /ai limit/i.test(spendErr.message) ? NextResponse.json({ error: "AI limit reached" }, { status: 429 }) : safeError(403);

  // Team first names, so drafts can be assigned (RLS: only this workspace's members)
  const { data: rows } = await sb.from("workspace_members").select("user_id").eq("workspace_id", body.workspaceId);
  const ids = (rows ?? []).map((r) => r.user_id as string);
  const { data: profiles } = ids.length ? await sb.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const people = (profiles ?? []).map((p) => ({ id: p.id as string, first: String(p.full_name || String(p.email).split("@")[0]).split(" ")[0].slice(0, 40) }));
  const names = Array.from(new Set(people.map((p) => p.first)));
  const idFor = (name: string | null) => (name ? people.find((p) => p.first.toLowerCase() === name.toLowerCase())?.id ?? null : null);

  const today = new Date().toISOString().slice(0, 10);
  try {
    const drafts = body.action === "meeting" ? await extractActionItems(body.text, names, today) : [await sentenceToTask(body.text, names, today)];
    return NextResponse.json({ tasks: drafts.map((d) => ({ ...d, assigneeId: idFor(d.assignee) })) });
  } catch (e) {
    console.error("[api/ai] provider failed", { status: e instanceof GeminiError ? e.status : "unknown" });
    return e instanceof GeminiError && e.status === 429 ? NextResponse.json({ error: "Too many requests" }, { status: 429 }) : safeError(502);
  }
}
