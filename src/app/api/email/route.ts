import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { serverTranslator } from "@/i18n/server";
import { accessTokenFrom, gmailSend, googleConfigured } from "@/lib/server/google";

// Real email notifications (phase B3). Two ways to send, tried in this order:
//   1. the SENDER's own Gmail, if they connected Google with the gmail.send scope
//      (Integrations → Email; env GOOGLE_OAUTH_CLIENT_ID / _SECRET, INTEGRATION_ENCRYPTION_KEY)
//   2. Resend. Env (set in .env.local, never committed):
//      RESEND_API_KEY   – from resend.com
//      EMAIL_FROM       – a sender on a domain verified in Resend, e.g. "PulseBoard <notify@yourdomain.com>"
//
// Safety: only signed-in users; only to members of the sender's own workspace
// (checked through RLS); max 50 emails per sender per hour; every send is logged
// in email_outbox. The HTML wrapper is written in the sender's interface
// language (body.locale, validated against the language registry).

const MAX_PER_HOUR = 50;
// Safe message for the browser; raw DB/provider errors only go to the server log / email_outbox
const GENERIC_ERROR = "Operation could not be completed";

const BodySchema = z.object({
  workspaceId: z.string().uuid(),
  toUserId: z.string().uuid(),
  subject: z.string().max(1000),
  text: z.string().max(20000),
  template: z.string().max(64).optional(),
  taskUrl: z.string().max(2048).optional(),
  locale: z.string().max(16).optional(),
});
type Body = z.infer<typeof BodySchema>;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);


export async function POST(req: Request) {
  // CSRF defence in depth: a browser always sends Origin on cross-site POSTs, so a
  // request from another site is refused before cookies are used.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  // Sign-in first, so signed-out callers learn nothing about the server's setup
  const { data: auth } = await sb.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  // The sender's own Google connection (RLS: only their own row is visible)
  const { data: google } = await sb.from("oauth_connections").select("account_email, scopes, refresh_token_enc").eq("provider", "google").maybeSingle();
  const viaGmail = !!google && String(google.scopes).includes("gmail.send") && googleConfigured();
  // 503 tells the app "email not set up" (it then skips quietly); variable names stay in this file only
  if (!viaGmail && (!key || !from)) return NextResponse.json({ error: "Email is not configured" }, { status: 503 });

  let body: Body;
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const subject = String(body.subject ?? "").slice(0, 200).trim();
  const text = String(body.text ?? "").slice(0, 5000).trim();
  if (!body.workspaceId || !body.toUserId || !subject || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Recipient must be in the same workspace. RLS only returns member rows of
  // workspaces the sender belongs to, so a foreign workspace returns nothing.
  const { data: member } = await sb.from("workspace_members").select("user_id").eq("workspace_id", body.workspaceId).eq("user_id", body.toUserId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Recipient is not in your workspace" }, { status: 403 });
  const { data: profile } = await sb.from("profiles").select("email, full_name").eq("id", body.toUserId).maybeSingle();
  if (!profile?.email) return NextResponse.json({ error: "Recipient has no email" }, { status: 404 });

  // Rate limit per sender
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: countErr } = await sb.from("email_outbox").select("id", { count: "exact", head: true }).eq("created_by", user.id).gte("created_at", since);
  // Fail closed: if the count can't be read, don't send (otherwise the limit is silently skipped)
  if (countErr || count === null) {
    console.error("[api/email] rate-limit count failed", { userId: user.id, code: countErr?.code });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
  if (count >= MAX_PER_HOUR) return NextResponse.json({ error: "Email limit reached, try again later" }, { status: 429 });

  // Queue first (RLS: sender must be able to edit in this workspace)
  const { data: queued, error: qErr } = await sb
    .from("email_outbox")
    .insert({ workspace_id: body.workspaceId, to_user_id: body.toUserId, to_email: profile.email, subject, template: body.template ?? "notification", created_by: user.id })
    .select("id")
    .single();
  if (qErr || !queued) {
    // Usually RLS (sender can't edit in this workspace); details stay in the server log
    console.error("[api/email] queue insert failed", { userId: user.id, workspaceId: body.workspaceId, code: qErr?.code });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { t, dir, locale } = await serverTranslator(body.locale);
  const link = body.taskUrl && /^https?:\/\//.test(body.taskUrl) ? `<p><a href="${escapeHtml(body.taskUrl)}">${escapeHtml(t("email.open"))}</a></p>` : "";
  const html = `<div dir="${dir}" lang="${locale}"><p>${escapeHtml(t("email.greeting", { name: profile.full_name || t("email.there") }))}</p><p>${escapeHtml(text)}</p>${link}<p style="color:#63788b;font-size:12px">${escapeHtml(t("email.footer"))}</p></div>`;

  if (viaGmail && google) {
    const access = await accessTokenFrom(google.refresh_token_enc as string);
    const sent = access ? await gmailSend(access, String(google.account_email), profile.email, subject, text, html) : { ok: false, status: 401 };
    await sb
      .from("email_outbox")
      .update({ status: sent.ok ? "sent" : "failed", provider_id: sent.ok && "id" in sent ? `gmail:${sent.id}` : null, error: sent.ok ? null : `Gmail HTTP ${sent.status}` })
      .eq("id", queued.id);
    if (!sent.ok) {
      console.error("[api/email] gmail send failed", { outboxId: queued.id, status: sent.status });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
    }
    return NextResponse.json({ ok: true, via: "gmail" });
  }
  if (!key || !from) return NextResponse.json({ error: "Email is not configured" }, { status: 503 });

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject,
        text,
        html,
      }),
    });
  } catch {
    console.error("[api/email] provider unreachable", { outboxId: queued.id });
    await sb.from("email_outbox").update({ status: "failed", error: "Provider unreachable" }).eq("id", queued.id);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }
  const out = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  await sb
    .from("email_outbox")
    .update({ status: res.ok ? "sent" : "failed", provider_id: out.id ?? null, error: res.ok ? null : out.message ?? `HTTP ${res.status}` })
    .eq("id", queued.id);

  if (!res.ok) {
    // Provider message is kept in email_outbox.error (visible to the sender and admins), not returned raw
    console.error("[api/email] provider rejected email", { outboxId: queued.id, status: res.status });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }
  return NextResponse.json({ ok: true, id: out.id });
}
