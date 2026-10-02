import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";
import { encryptSecret, safeEqual } from "@/lib/server/crypto";
import { accountEmail, exchangeCode, GOOGLE_SCOPES, googleConfigured } from "@/lib/server/google";

// Step 2: Google sends the user back here. The state must match the cookie made in
// step 1 for the same signed-in user (CSRF), the code is exchanged with the PKCE
// verifier, and only the encrypted refresh token is stored — as the user, so RLS
// keeps it on their own row. Errors redirect with a short code, never provider text.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (result: string) => NextResponse.redirect(new URL(`/integrations/email?google=${result}`, url.origin));
  const store = await cookies();
  const saved = store.get("pb_google_oauth")?.value;
  store.delete({ name: "pb_google_oauth", path: "/api/integrations/google" });
  if (!googleConfigured()) return back("setup");

  const sb = await getServerSupabase();
  const { data: auth } = (await sb?.auth.getUser()) ?? { data: { user: null } };
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  let cookie: { state: string; verifier: string; uid: string } | null = null;
  try {
    cookie = saved ? JSON.parse(saved) : null;
  } catch {
    cookie = null;
  }
  if (!sb || !auth.user || !code || !cookie || cookie.uid !== auth.user.id || !safeEqual(cookie.state, state)) return back("error");

  const tokens = await exchangeCode(code, url.origin, cookie.verifier);
  if (!tokens.access_token || !tokens.refresh_token) return back("error");
  const granted = tokens.scope ?? "";
  if (!granted.includes("gmail.send") && !granted.includes("calendar.freebusy")) return back("scopes");
  const email = await accountEmail(tokens.access_token);
  if (!email) return back("error");

  const { error } = await sb.from("oauth_connections").upsert(
    { provider: "google", account_email: email, scopes: GOOGLE_SCOPES.filter((s) => granted.includes(s.split("/").pop()!)).join(" "), refresh_token_enc: encryptSecret(tokens.refresh_token), updated_at: new Date().toISOString() },
    { onConflict: "user_id,provider" }
  );
  if (error) {
    console.error("[google callback] save failed", { code: error.code });
    return back("error");
  }
  return back("connected");
}
