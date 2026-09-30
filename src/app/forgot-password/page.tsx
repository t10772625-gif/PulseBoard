"use client";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "@/components/AuthHero";

function ForgotForm() {
  const linkError = useSearchParams().get("error") === "link";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // Only rate limiting is surfaced; every other outcome shows the same message
    // so the form can't be used to find out which emails have accounts.
    if (error && error.status === 429) return setError("Too many requests. Please wait a while and try again.");
    setSent(true);
  }

  return (
    <form className="form" onSubmit={submit}>
      <div>
        <h1>Reset your password</h1>
        <p className="mute">Enter your account email and we&apos;ll send you a link to set a new password.</p>
      </div>
      {!supabaseConfigured ? (
        <p className="warn" role="alert">Password reset isn&apos;t available in demo mode.</p>
      ) : sent ? (
        <p className="approval approved" role="status">
          If an account exists for that email, a reset link is on its way. Open it in this same browser.
        </p>
      ) : (
        <>
          {linkError && (
            <p className="warn" role="alert">That link is invalid or has expired. Request a new one.</p>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          {error && <p className="warn" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? "Please wait…" : "Send reset link"}
          </button>
        </>
      )}
      <p className="mute" style={{ textAlign: "center" }}>
        Remembered it?{" "}
        <Link className="link" href="/login">
          Log in
        </Link>
      </p>
    </form>
  );
}

export default function Page() {
  return (
    <section className="auth">
      <AuthHero
        cardA={{ title: "Design hero section", subtitle: "In progress, Ali" }}
        cardB={{ title: "Project health 82", subtitle: "Website redesign" }}
        heading="Locked out? Let's get you back in."
        description="We'll email you a secure, one-time link to choose a new password."
      />
      <div className="fw">
        <Suspense>
          <ForgotForm />
        </Suspense>
      </div>
    </section>
  );
}
