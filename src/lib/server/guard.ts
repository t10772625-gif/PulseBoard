import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";

// Shared checks for API route handlers (CLAUDE.md §6): same-origin POST, signed-in
// user, Zod-validated body, safe error messages only. Every query afterwards runs
// as that user, so Row Level Security still decides what they may read or change.

export const safeError = (status: number) =>
  NextResponse.json(
    { error: status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : status === 404 ? "Not found" : status === 400 ? "Invalid request" : status === 429 ? "Too many requests" : "Operation could not be completed" },
    { status }
  );

export type Authed = { sb: SupabaseClient; user: User };

// Returns the signed-in user and a user-scoped client, or an error response
export async function requireUser(req: Request): Promise<Authed | NextResponse> {
  // A browser always sends Origin on cross-site POSTs: refuse them before cookies are used
  const origin = req.headers.get("origin");
  if (req.method !== "GET" && origin && origin !== new URL(req.url).origin) return safeError(403);
  const sb = await getServerSupabase();
  if (!sb) return safeError(503);
  const { data } = await sb.auth.getUser();
  if (!data.user) return safeError(401);
  return { sb, user: data.user };
}

export async function readBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T> | NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return safeError(400);
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : safeError(400);
}

export const isResponse = (v: unknown): v is NextResponse => v instanceof NextResponse;

// Caller must be an Admin of that workspace (RLS helper, runs as the caller)
export async function isWorkspaceAdmin(sb: SupabaseClient, workspaceId: string): Promise<boolean> {
  const { data, error } = await sb.rpc("is_admin", { ws: workspaceId });
  return !error && data === true;
}

export const uuid = z.string().uuid();
