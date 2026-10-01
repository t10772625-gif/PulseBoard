"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "./AuthHero";
import { PasswordInput } from "./PasswordInput";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n";

// Supabase error codes → our own messages (provider text is never shown raw, CLAUDE.md §6.1)
const AUTH_ERRORS: Record<string, MessageKey> = {
  invalid_credentials: "auth.err.invalid",
  user_already_exists: "auth.err.exists",
  email_exists: "auth.err.exists",
  email_address_invalid: "auth.err.emailInvalid",
  validation_failed: "auth.err.emailInvalid",
  weak_password: "auth.err.weak",
  over_email_send_rate_limit: "auth.err.rate",
  over_request_rate_limit: "auth.err.rate",
  email_not_confirmed: "auth.err.notConfirmed",
};

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const reg = mode === "register";
  const { login } = useStore();
  const router = useRouter();
  const { t } = useT();
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
    if (password.length < 8) return setError(t("auth.pwShort"));
    setBusy(true);
    const res = reg
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) return setError(t(AUTH_ERRORS[res.error.code ?? ""] ?? "auth.err.generic"));
    if (reg && !res.data.session) {
      setInfo(t("auth.checkEmail"));
      return;
    }
    login();
    router.push("/dashboard");
  }

  return (
    <section className="auth">
      {reg ? (
        <AuthHero
          cardA={{ title: t("auth.regCardA"), subtitle: t("auth.regCardASub") }}
          cardB={{ title: t("auth.cardB"), subtitle: t("auth.cardBSub") }}
          heading={t("auth.regHeading")}
          description={t("auth.regDesc")}
        />
      ) : (
        <AuthHero
          cardA={{ title: t("auth.loginCardA"), subtitle: t("auth.loginCardASub") }}
          cardB={{ title: t("auth.cardB"), subtitle: t("auth.cardBSub") }}
          heading={t("auth.loginHeading")}
          description={t("auth.loginDesc")}
        />
      )}
      <div className="fw">
        <form className="form" onSubmit={submit}>
          <div className="auth-lang">
            <LanguageSwitcher />
          </div>
          <div>
            <h1>{reg ? t("auth.createTitle") : t("auth.loginTitle")}</h1>
            <p className="mute">{reg ? t("auth.ownerNote") : t("auth.welcomeBack")}</p>
          </div>
          {reg && (
            <label>
              {t("auth.fullName")}
              <input name="name" autoComplete="name" defaultValue={supabaseConfigured ? "" : "Ali Raza"} required={supabaseConfigured} />
            </label>
          )}
          <label>
            {t("common.email")}
            <input name="email" type="email" dir="ltr" autoComplete="email" defaultValue={supabaseConfigured ? "" : "ali@team.com"} required />
          </label>
          <label>
            {reg ? (
              t("common.password")
            ) : (
              <span className="auth-row">
                {t("common.password")}
                <Link className="link" href="/forgot-password" style={{ fontSize: 12 }}>
                  {t("auth.forgot")}
                </Link>
              </span>
            )}
            <PasswordInput name="password" autoComplete={reg ? "new-password" : "current-password"} defaultValue={supabaseConfigured ? "" : "password123"} required />
          </label>
          {error && <p className="warn" role="alert">{error}</p>}
          {info && <p className="approval approved">{info}</p>}
          <button className="btn" disabled={busy}>
            {busy ? t("auth.wait") : reg ? t("auth.createAccount") : t("auth.logIn")}
          </button>
          {!supabaseConfigured && (
            <p className="mute" style={{ fontSize: 12, textAlign: "center" }}>
              {t("auth.demoMode")}
            </p>
          )}
          <p className="mute" style={{ textAlign: "center" }}>
            {reg ? t("auth.haveAccount") : t("auth.newHere")}{" "}
            <Link className="link" href={reg ? "/login" : "/register"}>
              {reg ? t("auth.logIn") : t("auth.createAnAccount")}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
