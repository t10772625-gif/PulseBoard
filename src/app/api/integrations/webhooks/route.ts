import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";
import { encryptionConfigured, encryptSecret } from "@/lib/server/crypto";
import { DISCORD_WEBHOOK, SLACK_WEBHOOK, webhookHint } from "@/lib/server/outbound";

// Connect a Slack or Discord channel through its incoming-webhook URL. The URL is
// encrypted here and only the ciphertext is stored (25_integrations …2500). The
// insert runs as the caller, so RLS requires automation.manage in that workspace.
// Removing a webhook is a plain delete from the app (same permission).

const EVENTS = ["task.created", "task.done", "task.high", "task.assigned"] as const;

const Body = z.object({
  workspaceId: uuid,
  kind: z.enum(["slack", "discord"]),
  url: z.string().trim().max(500),
  events: z.array(z.enum(EVENTS)).min(1).max(4),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  if (!encryptionConfigured()) return NextResponse.json({ error: "Integrations are not configured on the server" }, { status: 503 });
  const pattern = body.kind === "slack" ? SLACK_WEBHOOK : DISCORD_WEBHOOK;
  if (!pattern.test(body.url)) return NextResponse.json({ error: "That isn't a valid incoming-webhook URL" }, { status: 400 });

  const { data, error } = await auth.sb
    .from("workspace_webhooks")
    .insert({ workspace_id: body.workspaceId, kind: body.kind, url_enc: encryptSecret(body.url), url_hint: webhookHint(body.url), events: Array.from(new Set(body.events)) })
    .select("id, kind, url_hint, events, active, created_at")
    .single();
  if (error || !data) {
    console.error("[api/webhooks] insert failed", { code: error?.code });
    return safeError(403);
  }
  return NextResponse.json({ webhook: data });
}
