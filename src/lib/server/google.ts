import { createHash } from "node:crypto";
import { decryptSecret } from "./crypto";

// Google OAuth for a person's own Gmail (send only) and Calendar free/busy.
// Env (server-only): GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET.
// Redirect URI to register in Google Cloud: <app origin>/api/integrations/google/callback
// This is separate from "Sign in with Google", which Supabase Auth handles.

export const GOOGLE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/calendar.freebusy"];

export const googleConfigured = () => !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);

export const redirectUri = (origin: string) => `${origin}/api/integrations/google/callback`;

export const pkceChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

export function authUrl(origin: string, state: string, verifier: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

type TokenResponse = { access_token?: string; refresh_token?: string; scope?: string; id_token?: string; error?: string };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!, client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!, ...params }),
    signal: AbortSignal.timeout(10000),
  });
  const out = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok) return { error: out.error ?? `http_${res.status}` };
  return out;
}

export const exchangeCode = (code: string, origin: string, verifier: string) =>
  tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin), code_verifier: verifier });

// A fresh access token from a stored (encrypted) refresh token, or null
export async function accessTokenFrom(refreshTokenEnc: string): Promise<string | null> {
  const refresh = decryptSecret(refreshTokenEnc);
  if (!refresh) return null;
  const out = await tokenRequest({ refresh_token: refresh, grant_type: "refresh_token" });
  return out.access_token ?? null;
}

export async function accountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  const u = (await res.json()) as { email?: string; email_verified?: boolean };
  return u.email && u.email_verified ? u.email : null;
}

export async function revoke(refreshTokenEnc: string): Promise<void> {
  const refresh = decryptSecret(refreshTokenEnc);
  if (!refresh) return;
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: "POST", signal: AbortSignal.timeout(10000) }).catch(() => undefined);
}

// RFC 2822 message, base64url for the Gmail API. Header values are stripped of
// line breaks so a subject can't inject extra headers.
const headerSafe = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 300);
const encodeWord = (s: string) => `=?UTF-8?B?${Buffer.from(headerSafe(s), "utf8").toString("base64")}?=`;

export async function gmailSend(accessToken: string, from: string, to: string, subject: string, text: string, html: string): Promise<{ ok: boolean; id?: string; status: number }> {
  const boundary = `pb_${Date.now().toString(36)}`;
  const mime = [
    `From: ${headerSafe(from)}`,
    `To: ${headerSafe(to)}`,
    `Subject: ${encodeWord(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    `--${boundary}--`,
  ].join("\r\n");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(mime, "utf8").toString("base64url") }),
    signal: AbortSignal.timeout(15000),
  });
  const out = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: res.ok, id: out.id, status: res.status };
}

// Busy blocks (start / end ISO strings) on the person's primary calendar
export async function busyBlocks(accessToken: string, timeMin: string, timeMax: string): Promise<{ start: string; end: string }[] | null> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: "primary" }] }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const out = (await res.json()) as { calendars?: { primary?: { busy?: { start: string; end: string }[] } } };
  return out.calendars?.primary?.busy ?? [];
}
