import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";
import { MAX_DELIVERIES_PER_MINUTE, postToChat, recentDeliveries } from "@/lib/server/deliver";

// "Send a test message" for one connected Slack / Discord channel. Needs
// automation.manage (checked through the database, as the caller).

const Body = z.object({ workspaceId: uuid, webhookId: uuid });

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  const { sb, user } = auth;

  const { data: allowed } = await sb.rpc("has_permission", { ws: body.workspaceId, perm: "automation.manage" });
  if (allowed !== true) return safeError(403);
  const recent = await recentDeliveries(sb, user.id);
  if (recent === null) return safeError(500);
  if (recent >= MAX_DELIVERIES_PER_MINUTE) return safeError(429);

  const { data: hook } = await sb.from("workspace_webhooks").select("id, kind, url_enc, url_hint").eq("id", body.webhookId).eq("workspace_id", body.workspaceId).maybeSingle();
  if (!hook) return safeError(404);
  const status = await postToChat(sb, body.workspaceId, hook as never, "test", "👋 Test message from PulseBoard: this channel is connected.", `${new URL(req.url).origin}/dashboard`);
  return NextResponse.json({ ok: status >= 200 && status < 300, status });
}
