import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret, signBody } from "./crypto";
import { checkOutboundUrl, slackEscape } from "./outbound";

// Posting to Slack / Discord / rule webhooks, with a delivery log row each time.
// Runs as the signed-in member whose action caused it (RLS on every read / write).

export const MAX_DELIVERIES_PER_MINUTE = 30;

export async function recentDeliveries(sb: SupabaseClient, userId: string): Promise<number | null> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await sb.from("webhook_deliveries").select("id", { count: "exact", head: true }).eq("created_by", userId).gte("created_at", since);
  return error ? null : count ?? 0;
}

async function post(url: string, body: string, headers: Record<string, string>): Promise<number> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body, redirect: "manual", signal: AbortSignal.timeout(8000) });
    return res.status;
  } catch {
    return 0; // network error / timeout
  }
}

type Chat = { id: string; kind: "slack" | "discord"; url_enc: string; url_hint: string };

export async function postToChat(sb: SupabaseClient, workspaceId: string, hook: Chat, event: string, text: string, link: string): Promise<number> {
  const url = decryptSecret(hook.url_enc);
  let status = 0;
  if (url) {
    // Slack: escape its control characters. Discord: never ping @everyone / roles / users.
    const body =
      hook.kind === "slack"
        ? JSON.stringify({ text: `${slackEscape(text)}\n<${link}|Open in PulseBoard>` })
        : JSON.stringify({ content: `${text}\n${link}`.slice(0, 1900), allowed_mentions: { parse: [] } });
    status = await post(url, body, {});
  }
  await sb.from("webhook_deliveries").insert({ workspace_id: workspaceId, url: `https://${hook.url_hint}`, event, status_code: status, attempts: 1, target: hook.kind });
  return status;
}

// Automation rule → the URL the user typed. Signed with WEBHOOK_SIGNING_SECRET
// (header X-PulseBoard-Signature: sha256=<hex of HMAC over the raw body>).
export async function postToRuleUrl(sb: SupabaseClient, workspaceId: string, ruleId: string, rawUrl: string, event: string, payload: object): Promise<number> {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  const url = secret ? await checkOutboundUrl(rawUrl) : null;
  let status = 0;
  if (url && secret) {
    const body = JSON.stringify(payload);
    status = await post(url.toString(), body, { "X-PulseBoard-Signature": signBody(body, secret), "X-PulseBoard-Event": event, "User-Agent": "PulseBoard-Webhooks/1" });
  }
  await sb.from("webhook_deliveries").insert({
    workspace_id: workspaceId,
    rule_id: ruleId,
    url: rawUrl.startsWith("https://") ? rawUrl.slice(0, 500) : "https://invalid",
    event,
    status_code: url && secret ? status : -1,
    attempts: url && secret ? 1 : 0,
    target: "rule",
  });
  return status;
}
