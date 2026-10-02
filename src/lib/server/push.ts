import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

// Web Push (free, no provider account). Env:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (public, the browser needs it to subscribe)
//   VAPID_PRIVATE_KEY             (server-only)
//   VAPID_SUBJECT                 (server-only, "mailto:you@yourdomain.com")
// Generate a key pair once with: npx web-push generate-vapid-keys

export const pushConfigured = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

let ready = false;
function setup() {
  if (ready || !pushConfigured()) return ready;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  ready = true;
  return ready;
}

type Target = { user_id: string; endpoint: string; p256dh: string; auth: string };

// Sends one small notification to every browser of the given people (who must
// share the workspace with the caller; checked by push_targets). Payload holds only
// a short text and an in-app path, never task details beyond the title.
export async function pushToPeople(sb: SupabaseClient, workspaceId: string, people: string[], title: string, body: string, path: string): Promise<number> {
  if (!people.length || !setup()) return 0;
  const { data, error } = await sb.rpc("push_targets", { ws: workspaceId, people });
  if (error || !data) return 0;
  const payload = JSON.stringify({ title: title.slice(0, 80), body: body.slice(0, 200), path: path.startsWith("/") ? path : "/dashboard" });
  let sent = 0;
  await Promise.all(
    (data as Target[]).map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, { TTL: 3600 });
        sent++;
      } catch {
        // Expired subscriptions (404 / 410) are left for their owner's browser to replace
      }
    })
  );
  return sent;
}
