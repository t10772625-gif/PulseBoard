import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, isWorkspaceAdmin, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";

// Custom domain ownership check (ADV-01). The Admin adds a DNS TXT record
//   _pulseboard.<domain>  →  pulseboard-verify=<workspace domain_token>
// and this route looks it up live over DNS-over-HTTPS (Cloudflare 1.1.1.1, free,
// no key). Only the domain saved in the workspace settings is checked, never a
// domain from the request, and nothing is stored: the result is shown to the Admin.
// Passing this check proves ownership of the domain; serving the app on it still
// needs the hosting provider (not set up yet).

const Body = z.object({ workspaceId: uuid });

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  if (!(await isWorkspaceAdmin(auth.sb, body.workspaceId))) return safeError(403);

  const { data: settings, error } = await auth.sb.from("workspace_settings").select("custom_domain, domain_token").eq("workspace_id", body.workspaceId).maybeSingle();
  if (error || !settings) return safeError(404);
  const domain = settings.custom_domain as string | null;
  if (!domain || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) return safeError(400);

  const name = `_pulseboard.${domain}`;
  const expected = `pulseboard-verify=${settings.domain_token}`;
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, {
      headers: { accept: "application/dns-json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return safeError(502);
    const dns = (await res.json()) as { Answer?: { data?: string }[] };
    // TXT data comes back quoted, possibly split into several strings
    const found = (dns.Answer ?? []).some((a) => (a.data ?? "").replace(/"\s*"/g, "").replace(/"/g, "").trim() === expected);
    return NextResponse.json({ verified: found, record: { name, value: expected } });
  } catch {
    return safeError(502);
  }
}
