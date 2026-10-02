import { NextResponse } from "next/server";
import { isResponse, requireUser, safeError } from "@/lib/server/guard";
import { revoke } from "@/lib/server/google";

// Disconnect Google: revoke the token at Google, then delete your connection row.
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const { data } = await auth.sb.from("oauth_connections").select("id, refresh_token_enc").eq("provider", "google").maybeSingle();
  if (!data) return NextResponse.json({ ok: true });
  await revoke(data.refresh_token_enc as string);
  const { error } = await auth.sb.from("oauth_connections").delete().eq("id", data.id);
  if (error) return safeError(500);
  return NextResponse.json({ ok: true });
}
