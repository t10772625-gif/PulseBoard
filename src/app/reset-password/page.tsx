"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "@/components/AuthHero";
import { PasswordInput } from "@/components/PasswordInput";

// Reached from /auth/callback after a recovery link sets a session.
export default function Page() {
  const [hasSession, setHasSession] = useState<boolean | null>(supabaseConfigured ? null : false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabase()
      ?.auth.getSession()
      .then(({ data }) => setHasSession(!!data.session));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(error.status === 422 ? "Choose a different password from your current one." : "Could not update password. Request a new link and try again.");
    }
    // End the recovery session so the user signs in fresh with the new password.
    await supabase.auth.signOut();
    setBusy(false);
    setDone(true);
  }

  return (
    <section className="auth">
      <AuthHero
        cardA={{ title: "Design hero section", subtitle: "In progress, Ali" }}
        cardB={{ title: "Project health 82", subtitle: "Website redesign" }}
        heading="Choose a new password."
        description="Use at least 8 characters. You'll log in with it right after."
      />
      <div className="fw">
        <form className="form" onSubmit={submit}>
          <div>
            <h1>Set a new password</h1>
          </div>
          {!supabaseConfigured ? (
            <p className="warn" role="alert">Password reset isn&apos;t available in demo mode.</p>
          ) : done ? (
            <>
              <p className="approval approved" role="status">Your password was updated.</p>
              <Link className="btn" href="/login" style={{ textAlign: "center" }}>
                Log in
              </Link>
            </>
          ) : hasSession === null ? (
            <p className="mute">Checking your link…</p>
          ) : !hasSession ? (
            <p className="warn" role="alert">
              This page needs a valid reset link.{" "}
              <Link className="link" href="/forgot-password">
                Request a new one
              </Link>
              .
            </p>
          ) : (
            <>
              <label>
                New password
                <PasswordInput name="password" autoComplete="new-password" minLength={8} required />
              </label>
              <label>
                Confirm new password
                <PasswordInput name="confirm" autoComplete="new-password" minLength={8} required />
              </label>
              {error && <p className="warn" role="alert">{error}</p>}
              <button className="btn" disabled={busy}>
                {busy ? "Please wait…" : "Update password"}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
