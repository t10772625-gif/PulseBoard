import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isResponse, requireUser, safeError } from "@/lib/server/guard";
import { encryptionConfigured, randomToken } from "@/lib/server/crypto";
import { authUrl, googleConfigured } from "@/lib/server/google";

// Step 1 of connecting your Google account (Gmail send + Calendar free/busy):
// a random state (CSRF) and a PKCE verifier go into a short-lived httpOnly cookie
// bound to your user id, then Google's consent screen opens.
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  if (!googleConfigured() || !encryptionConfigured()) return safeError(503);
  const state = randomToken(24);
  const verifier = randomToken(48);
  const store = await cookies();
  store.set("pb_google_oauth", JSON.stringify({ state, verifier, uid: auth.user.id }), {
    httpOnly: true,
    secure: new URL(req.url).protocol === "https:",
    sameSite: "lax",
    path: "/api/integrations/google",
    maxAge: 600,
  });
  return NextResponse.redirect(authUrl(new URL(req.url).origin, state, verifier));
}
