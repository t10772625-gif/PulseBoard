import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Env var names (set in .env.local, never committed):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
// Both are safe to expose to the browser; access is enforced by Row Level Security.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY);

let client: SupabaseClient | null = null;

// Returns null in demo mode (env not set), so callers can fall back to mock data.
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) client = createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
  return client;
}
