"use client";
import { getSupabase } from "./supabase/client";

// Browser side of the integrations (25_integrations). Reads and simple writes go
// straight to Supabase as the signed-in user (RLS); anything that needs a secret
// (encrypting a webhook URL, Google tokens, Gemini, push signing) goes through the
// /api routes, which never return secrets.

export type ServerSetup = { ai: boolean; google: boolean; chatWebhooks: boolean; ruleWebhooks: boolean; push: boolean; email: boolean };
export type ChatWebhook = { id: string; kind: "slack" | "discord"; url_hint: string; events: string[]; active: boolean; created_at: string };
export type Delivery = { id: number; url: string; event: string; status_code: number | null; target: string | null; created_at: string };
export type Feed = { token: string; created_at: string; revoked_at: string | null };
export type GoogleConnection = { account_email: string; scopes: string } | null;

const sb = () => getSupabase();

async function api<T>(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

export const serverSetup = async (): Promise<ServerSetup | null> => (await api<ServerSetup>("/api/integrations/status")).data;

// ---- Slack / Discord ----
export async function listChatWebhooks(ws: string): Promise<ChatWebhook[]> {
  const { data } = (await sb()?.from("workspace_webhooks").select("id, kind, url_hint, events, active, created_at").eq("workspace_id", ws).order("created_at")) ?? { data: null };
  return (data as ChatWebhook[] | null) ?? [];
}
export const addChatWebhook = (workspaceId: string, kind: "slack" | "discord", url: string, events: string[]) => api<{ webhook: ChatWebhook; error?: string }>("/api/integrations/webhooks", { workspaceId, kind, url, events });
export const testChatWebhook = (workspaceId: string, webhookId: string) => api<{ ok: boolean }>("/api/integrations/webhooks/test", { workspaceId, webhookId });
export async function removeChatWebhook(id: string): Promise<boolean> {
  const res = await sb()?.from("workspace_webhooks").delete().eq("id", id);
  return !!res && !res.error;
}
export async function setChatWebhookActive(id: string, active: boolean): Promise<boolean> {
  const res = await sb()?.from("workspace_webhooks").update({ active }).eq("id", id);
  return !!res && !res.error;
}
export async function listDeliveries(ws: string): Promise<Delivery[]> {
  const { data } = (await sb()?.from("webhook_deliveries").select("id, url, event, status_code, target, created_at").eq("workspace_id", ws).order("created_at", { ascending: false }).limit(50)) ?? { data: null };
  return (data as Delivery[] | null) ?? [];
}

// ---- Calendar feed ----
export async function listFeeds(ws: string): Promise<Feed[]> {
  const { data } = (await sb()?.from("calendar_feeds").select("token, created_at, revoked_at").eq("workspace_id", ws).is("revoked_at", null).order("created_at", { ascending: false })) ?? { data: null };
  return (data as Feed[] | null) ?? [];
}
export async function createFeed(ws: string): Promise<Feed | null> {
  const { data, error } = (await sb()?.from("calendar_feeds").insert({ workspace_id: ws }).select("token, created_at, revoked_at").single()) ?? { data: null, error: true };
  return error ? null : (data as Feed);
}
export async function revokeFeed(token: string): Promise<boolean> {
  const res = await sb()?.from("calendar_feeds").update({ revoked_at: new Date().toISOString() }).eq("token", token);
  return !!res && !res.error;
}
export const feedUrl = (token: string) => `${window.location.origin}/api/calendar/feed/${token}.ics`;

// ---- Google (Gmail send + Calendar free/busy) ----
export async function googleConnection(): Promise<GoogleConnection> {
  const { data } = (await sb()?.from("oauth_connections").select("account_email, scopes").eq("provider", "google").maybeSingle()) ?? { data: null };
  return (data as GoogleConnection) ?? null;
}
export const disconnectGoogle = () => api<{ ok: boolean }>("/api/integrations/google/disconnect", {});
export async function googleConnectedMembers(ws: string): Promise<string[]> {
  const { data } = (await sb()?.rpc("google_connected_members", { ws })) ?? { data: null };
  return (data as string[] | null) ?? [];
}
export const freeBusy = (workspaceId: string, people: string[], timeMin: string, timeMax: string) =>
  api<{ busy: Record<string, { start: string; end: string }[]>; unknown: string[] }>("/api/calendar/freebusy", { workspaceId, people, timeMin, timeMax });

// ---- Web push ----
function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// Ask permission, subscribe this browser and save the subscription (RLS: own row)
export async function enablePush(): Promise<"ok" | "denied" | "unsupported" | "setup" | "failed"> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!pushSupported()) return "unsupported";
  if (!key) return "setup";
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return "failed";
    const res = await sb()?.from("push_subscriptions").insert({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
    // Already saved for you on an earlier visit: that's fine
    if (res?.error && !/duplicate/i.test(res.error.message)) return "failed";
    return "ok";
  } catch {
    return "failed";
  }
}
export const testPush = (workspaceId: string) => api<{ sent: number }>("/api/push/test", { workspaceId });

// ---- AI (Gemini) ----
export type AiDraft = { title: string; assignee: string | null; assigneeId: string | null; due_in_days: number | null; priority: "h" | "m" | "l"; labels: string[] };
export const aiDrafts = (workspaceId: string, action: "meeting" | "sentence", text: string) => api<{ tasks?: AiDraft[]; error?: string }>("/api/ai", { workspaceId, action, text });

// ---- Task events → channels / rule webhooks / push (fire and forget) ----
export function notifyServer(workspaceId: string, taskId: string, event: "task.created" | "task.done" | "task.high" | "task.assigned" | "task.overdue") {
  void fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, taskId, event }) }).catch(() => undefined);
}
