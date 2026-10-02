"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "./AuthHero";
import { PasswordInput } from "./PasswordInput";
import LanguageSwitcher from "./LanguageSwitcher";
import Dropdown from "./Dropdown";
import FieldError, { invalid } from "./FieldError";
import { first, hasErrors, v, type FieldMsg } from "@/lib/validate";
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
  mfa_verification_failed: "auth.err.code",
  mfa_challenge_expired: "auth.err.code",
};

// Same allow-lists as the sign-up trigger (21_simplify-roles …2150)
const TEAM_SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;
const USE_CASES = ["software", "agency", "marketing", "operations", "personal", "other"] as const;

// Sign-in also needs the 6-digit code when the account has two-factor authentication
// (Supabase TOTP). Returns the verified factor id, or null when no code is needed.
export async function pendingMfaFactor(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") return null;
  const { data } = await sb.auth.mfa.listFactors();
  return data?.totp.find((f) => f.status === "verified")?.id ?? null;
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const reg = mode === "register";
  const { login } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [teamSize, setTeamSize] = useState<string>("");
  const [useCase, setUseCase] = useState<string>("");
  // Second sign-in step (2FA): the factor to verify and the code typed
  const [mfaFactor, setMfaFactor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  // Per-field problems, shown under each field; cleared as soon as the field is edited
  const [errors, setErrors] = useState<Record<string, FieldMsg>>({});
  const clearError = (e: FormEvent<HTMLFormElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (name && errors[name]) setErrors((x) => ({ ...x, [name]: null }));
  };

  // Arriving here from the app (or after Google / GitHub) with a session that still
  // needs its 2FA code: go straight to the code step
  useEffect(() => {
    if (reg || !supabaseConfigured) return;
    void pendingMfaFactor().then((f) => {
      if (f) setMfaFactor(f);
    });
  }, [reg]);

  // Back from a failed Google / GitHub sign-in (see /auth/callback)
  const shownError = error ?? (params.get("error") === "oauth" ? t("auth.err.oauth") : null);

  function enterApp() {
    login();
    router.push("/dashboard");
  }

  async function oauth(provider: "google" | "github") {
    const supabase = getSupabase();
    if (!supabase) return;
    setError(null);
    setBusy(true);
    // Provider must be enabled in Supabase (Authentication → Providers); the callback
    // route exchanges the code and only redirects inside the app
    const { error: err } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` } });
    if (err) {
      setBusy(false);
      setError(t("auth.err.oauth"));
    }
  }

  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !mfaFactor) return;
    if (!/^\d{6}$/.test(code)) return setError(t("security.enterCode"));
    setBusy(true);
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactor, code });
    setBusy(false);
    if (err) return setError(t(AUTH_ERRORS[err.code ?? ""] ?? "auth.err.code"));
    enterApp();
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    // Demo mode: Supabase env vars aren't set, keep the mock sign-in
    if (!supabase) return enterApp();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const found: Record<string, FieldMsg> = reg
      ? {
          name: v.name(String(form.get("name") ?? ""), 120),
          workspace: v.name(String(form.get("workspace") ?? ""), 80),
          email: v.email(email),
          password: v.password(password),
          confirm: v.same(password, String(form.get("confirm") ?? "")),
          job: v.maxLen(String(form.get("job") ?? ""), 80),
        }
      : { email: v.email(email), password: first(v.required(password)) };
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy(true);
    const res = reg
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            // Cleaned and length-checked again by the sign-up trigger (handle_new_user)
            data: {
              full_name: String(form.get("name") ?? "").trim().slice(0, 120),
              workspace_name: String(form.get("workspace") ?? "").trim().slice(0, 80),
              job_title: String(form.get("job") ?? "").trim().slice(0, 80),
              team_size: teamSize,
              use_case: useCase,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    if (res.error) {
      setBusy(false);
      return setError(t(AUTH_ERRORS[res.error.code ?? ""] ?? "auth.err.generic"));
    }
    if (reg && !res.data.session) {
      setBusy(false);
      setInfo(t("auth.checkEmail"));
      return;
    }
    const factor = await pendingMfaFactor();
    setBusy(false);
    if (factor) {
      setMfaFactor(factor);
      return;
    }
    enterApp();
  }

  const hero = reg ? (
    <AuthHero
      heading={t("auth.regHeading")}
      description={t("auth.regDesc")}
    />
  ) : (
    <AuthHero
      heading={t("auth.loginHeading")}
      description={t("auth.loginDesc")}
    />
  );

  if (mfaFactor) {
    return (
      <section className="auth">
        {hero}
        <div className="fw">
          <form className="form" onSubmit={verifyCode}>
            <div>
              <h1>{t("auth.mfaTitle")}</h1>
              <p className="mute" id="mfa-hint">{t("auth.mfaHint")}</p>
            </div>
            <label>
              {t("auth.mfaCode")}
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" dir="ltr" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-describedby="mfa-hint" autoFocus />
            </label>
            {error && <p className="warn" role="alert">{error}</p>}
            <button className="btn" disabled={busy}>
              {busy ? t("auth.wait") : t("security.verify")}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={async () => {
                await getSupabase()?.auth.signOut();
                setMfaFactor(null);
                setCode("");
                setError(null);
              }}
            >
              {t("auth.mfaCancel")}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="auth">
      {hero}
      <div className="fw">
        <form className={`form ${reg ? "auth-reg" : ""}`} onSubmit={submit} onInput={clearError} noValidate>
          <div className="auth-lang">
            <LanguageSwitcher />
          </div>
          <div>
            <h1>{reg ? t("auth.createTitle") : t("auth.loginTitle")}</h1>
            <p className="mute">{reg ? t("auth.ownerNote") : t("auth.welcomeBack")}</p>
          </div>

          {supabaseConfigured && (
            <>
              <div className="auth-oauth">
                <button type="button" className="ghost" disabled={busy} onClick={() => oauth("google")}>
                  {t("auth.withGoogle")}
                </button>
                <button type="button" className="ghost" disabled={busy} onClick={() => oauth("github")}>
                  {t("auth.withGithub")}
                </button>
              </div>
              <p className="auth-or mute">{t("auth.orEmail")}</p>
            </>
          )}

          {reg && (
            <div className="auth-grid">
              <label>
                {t("auth.fullName")}
                <input name="name" autoComplete="name" maxLength={120} placeholder={t("auth.namePlaceholder")} defaultValue={supabaseConfigured ? "" : "Ali Raza"} required={supabaseConfigured} {...invalid("err-name", errors.name)} />
                <FieldError id="err-name" msg={errors.name} />
              </label>
              <label>
                {t("auth.workspaceName")}
                <input name="workspace" autoComplete="organization" maxLength={80} placeholder={t("auth.workspacePlaceholder")} required={supabaseConfigured} {...invalid("err-workspace", errors.workspace)} />
                <FieldError id="err-workspace" msg={errors.workspace} />
              </label>
            </div>
          )}
          <label>
            {reg ? t("auth.workEmail") : t("common.email")}
            <input name="email" type="email" dir="ltr" autoComplete="email" maxLength={254} placeholder={t("auth.emailPlaceholder")} defaultValue={supabaseConfigured ? "" : "ali@team.com"} required {...invalid("err-email", errors.email)} />
            <FieldError id="err-email" msg={errors.email} />
          </label>
          {reg ? (
            <div className="auth-grid">
              <label>
                {t("common.password")}
                <PasswordInput name="password" autoComplete="new-password" minLength={8} maxLength={72} placeholder={t("auth.pwPlaceholderNew")} defaultValue={supabaseConfigured ? "" : "password123"} required {...invalid("err-password", errors.password)} />
                <FieldError id="err-password" msg={errors.password} />
              </label>
              <label>
                {t("auth.confirmPassword")}
                <PasswordInput name="confirm" autoComplete="new-password" minLength={8} maxLength={72} placeholder={t("auth.pwPlaceholderConfirm")} defaultValue={supabaseConfigured ? "" : "password123"} required {...invalid("err-confirm", errors.confirm)} />
                <FieldError id="err-confirm" msg={errors.confirm} />
              </label>
            </div>
          ) : (
            <label>
              <span className="auth-row">
                {t("common.password")}
                <Link className="link" href="/forgot-password" style={{ fontSize: 12 }}>
                  {t("auth.forgot")}
                </Link>
              </span>
              <PasswordInput name="password" autoComplete="current-password" maxLength={72} placeholder={t("auth.pwPlaceholder")} defaultValue={supabaseConfigured ? "" : "password123"} required {...invalid("err-password", errors.password)} />
              <FieldError id="err-password" msg={errors.password} />
            </label>
          )}
          {reg && <p className="mute auth-pw-hint">{t("auth.pwRules")}</p>}

          {reg && (
            <>
              <label>
                <span>
                  {t("auth.jobTitle")} <span className="mute">{t("auth.optional")}</span>
                </span>
                <input name="job" autoComplete="organization-title" maxLength={80} placeholder={t("auth.jobPlaceholder")} {...invalid("err-job", errors.job)} />
                <FieldError id="err-job" msg={errors.job} />
              </label>
              <div className="auth-grid">
                <label>
                  <span>
                  {t("auth.teamSize")} <span className="mute">{t("auth.optional")}</span>
                </span>
                  <Dropdown value={teamSize} onChange={setTeamSize} options={[{ value: "", label: t("auth.choose") }, ...TEAM_SIZES.map((v) => ({ value: v, label: t(`auth.team.${v}`) }))]} />
                </label>
                <label>
                  <span>
                  {t("auth.useCase")} <span className="mute">{t("auth.optional")}</span>
                </span>
                  <Dropdown value={useCase} onChange={setUseCase} options={[{ value: "", label: t("auth.choose") }, ...USE_CASES.map((v) => ({ value: v, label: t(`auth.use.${v}`) }))]} />
                </label>
              </div>
            </>
          )}

          {shownError && <p className="warn" role="alert">{shownError}</p>}
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
