import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/client";

// Private calendar subscription feed (.ics) for a person's own open tasks.
// Calendar apps (Google Calendar "From URL", Outlook, Apple) fetch it without
// signing in, so the 32-hex token in the path is the only key. Data comes only
// from get_calendar_feed() (25_integrations …2510): key, title, board, due date.

export const dynamic = "force-dynamic";

// RFC 5545 text escaping + folding at 75 octets
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest, "utf8") > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut), "utf8") > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const clean = token.replace(/\.ics$/, "");
  if (!/^[0-9a-f]{32}$/.test(clean) || !supabaseConfigured) return new NextResponse("Not found", { status: 404 });

  // Anonymous client: no cookies, no session; the function is the only thing it can call
  const sb = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.rpc("get_calendar_feed", { p_token: clean });
  if (error) return new NextResponse("Not found", { status: 404 });
  const rows = (data ?? []) as { task_key: string; title: string; board: string; due_date: string }[];

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PulseBoard//Tasks//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:PulseBoard — my tasks", "REFRESH-INTERVAL;VALUE=DURATION:PT1H"];
  for (const r of rows) {
    const day = r.due_date.replace(/-/g, "");
    const next = new Date(r.due_date + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${esc((r.task_key || r.title).replace(/\s+/g, "-"))}-${day}@pulseboard`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
      `SUMMARY:${esc((r.task_key ? r.task_key + " " : "") + r.title)}`,
      `DESCRIPTION:${esc(r.board)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300", "X-Robots-Tag": "noindex" },
  });
}
