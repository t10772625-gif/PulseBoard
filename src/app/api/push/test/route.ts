import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, readBody, requireUser, safeError, uuid } from "@/lib/server/guard";
import { pushConfigured, pushToPeople } from "@/lib/server/push";

// Sends a test push to your own browsers (after you allowed notifications)
const Body = z.object({ workspaceId: uuid });

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (isResponse(auth)) return auth;
  const body = await readBody(req, Body);
  if (isResponse(body)) return body;
  if (!pushConfigured()) return safeError(503);
  const sent = await pushToPeople(auth.sb, body.workspaceId, [auth.user.id], "PulseBoard", "Push notifications work on this device.", "/automations/notifications");
  return NextResponse.json({ sent });
}
