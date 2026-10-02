import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// Landing point for Supabase email links (password recovery, email confirmation)
// and for Google / GitHub sign-in. Exchanges the one-time PKCE code for a session cookie, then
// redirects inside the app only. `next` is checked against an allowlist so the
// link can't be used as an open redirect.
const ALLOWED_NEXT = new Set(["/reset-password", "/dashboard"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = ALLOWED_NEXT.has(nextParam) ? nextParam : "/dashboard";

  const supabase = await getServerSupabase();
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  // Missing, expired or already-used link, or a Google / GitHub sign-in that failed
  // (provider not enabled, user cancelled). Don't echo provider errors back.
  if (nextParam === "/reset-password") return NextResponse.redirect(new URL("/forgot-password?error=link", url.origin));
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
