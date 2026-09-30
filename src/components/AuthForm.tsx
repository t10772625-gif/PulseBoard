"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "./AuthHero";
import { PasswordInput } from "./PasswordInput";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const reg = mode === "register";
  const { login } = useStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    // Demo mode: Supabase env vars aren't set, keep the mock sign-in
    if (!supabase) {
      login();
      router.push("/dashboard");
      return;
    }
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "").trim();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    const res = reg
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) return setError(res.error.message);
    if (reg && !res.data.session) {
      setInfo("Check your email to confirm your account, then log in.");
      return;
    }
    login();
    router.push("/dashboard");
  }

  return (
    <section className="auth">
      {reg ? (
        <AuthHero
          cardA={{ title: "Owner, Admin, Member, Viewer", subtitle: "Roles for every teammate" }}
          cardB={{ title: "Project health 82", subtitle: "Website redesign" }}
          heading="Set up your team's workspace in minutes."
          description="Create projects, invite people and start assigning tasks today."
        />
      ) : (
        <AuthHero
          cardA={{ title: "Design hero section", subtitle: "In progress, Ali" }}
          cardB={{ title: "Project health 82", subtitle: "Website redesign" }}
          heading="Feel your project's pulse before it flatlines."
          description="Every project shows a live health score, so blockers and overdue work surface early."
        />
      )}
      <div className="fw">
        <form className="form" onSubmit={submit}>
          <div>
            <h1>{reg ? "Create your account" : "Log in to PulseBoard"}</h1>
            <p className="mute">{reg ? "You will be the owner of your workspace." : "Welcome back. Pick up where you left off."}</p>
          </div>
          {reg && (
            <label>
              Full name
              <input name="name" autoComplete="name" defaultValue={supabaseConfigured ? "" : "Ali Raza"} required={supabaseConfigured} />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" defaultValue={supabaseConfigured ? "" : "ali@team.com"} required />
          </label>
          <label>
            {reg ? (
              "Password"
            ) : (
              <span className="auth-row">
                Password
                <Link className="link" href="/forgot-password" style={{ fontSize: 12 }}>
                  Forgot password?
                </Link>
              </span>
            )}
            <PasswordInput name="password" autoComplete={reg ? "new-password" : "current-password"} defaultValue={supabaseConfigured ? "" : "password123"} required />
          </label>
          {error && <p className="warn" role="alert">{error}</p>}
          {info && <p className="approval approved">{info}</p>}
          <button className="btn" disabled={busy}>
            {busy ? "Please wait…" : reg ? "Create account" : "Log in"}
          </button>
          {!supabaseConfigured && (
            <p className="mute" style={{ fontSize: 12, textAlign: "center" }}>
              Demo mode: Supabase isn&apos;t configured, so any details sign you in with sample data.
            </p>
          )}
          <p className="mute" style={{ textAlign: "center" }}>
            {reg ? "Already have an account? " : "New to PulseBoard? "}
            <Link className="link" href={reg ? "/login" : "/register"}>
              {reg ? "Log in" : "Create an account"}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
