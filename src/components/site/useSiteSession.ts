"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { pendingMfaFactor } from "@/components/AuthForm";

// Public pages (landing, features, pricing…) live outside the app layout, so the
// store doesn't know about a Supabase session there. This picks it up: with a
// session (and no pending 2FA step) the store signs in and loads the workspace, so
// the public pages can say "Open app" and show your current plan.
export function useSiteSession(): boolean {
  const { loggedIn, login } = useStore();
  const [session, setSession] = useState(false);
  useEffect(() => {
    if (loggedIn) return;
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(async ({ data }) => {
      if (!data.session || (await pendingMfaFactor())) return;
      setSession(true);
      login();
    });
  }, [loggedIn, login]);
  return loggedIn || session;
}
