import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, uuid } from "@/lib/server/guard";
import { accessTokenFrom, busyBlocks, googleConfigured } from "@/lib/server/google";

// Meeting scheduler: busy blocks for the chosen teammates on one day, from the
// Google calendars they connected themselves (calendar.freebusy scope: only busy /
// free times, never titles). People who haven't connected are reported as unknown.
// freebusy_tokens() only returns people who share this workspace with the caller.

const Body = z.object({
  workspaceId: uuid,
  people: z.array(uuid).min(1).max(20),
  // The day in the browser's time zone, as an ISO range
  timeMin: z.string().datetime({ offset: true }),
  timeMax: z.string().datetime({ offset: true }),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  if (!googleConfigured()) return NextResponse.json({ busy: {}, unknown: body.people });
  if (new Date(body.timeMax).getTime() - new Date(body.timeMin).getTime() > 7 * 86400_000) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data } = await auth.sb.rpc("freebusy_tokens", { ws: body.workspaceId, people: body.people });
  const rows = (data ?? []) as { user_id: string; refresh_token_enc: string }[];
  const busy: Record<string, { start: string; end: string }[]> = {};
  await Promise.all(
    rows.map(async (r) => {
      const access = await accessTokenFrom(r.refresh_token_enc);
      const blocks = access ? await busyBlocks(access, body.timeMin, body.timeMax) : null;
      if (blocks) busy[r.user_id] = blocks;
    })
  );
  return NextResponse.json({ busy, unknown: body.people.filter((p) => !busy[p]) });
}
