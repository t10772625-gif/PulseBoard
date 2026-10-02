"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "@/components/AuthHero";
import { PasswordInput } from "@/components/PasswordInput";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FieldError, { invalid } from "@/components/FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

// Reached from /auth/callback after a recovery link sets a session.
export default function Page() {
  const [hasSession, setHasSession] = useState<boolean | null>(supabaseConfigured ? null : false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, FieldMsg>>({});
  const { t } = useT();

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
    const found = { password: v.password(password), confirm: v.same(password, confirm) };
    setErrors(found);
    if (found.password || found.confirm) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(error.status === 422 ? t("reset.same") : t("reset.failed"));
    }
    // End the recovery session so the user signs in fresh with the new password.
    await supabase.auth.signOut();
    setBusy(false);
    setDone(true);
  }

  return (
    <section className="auth">
      <AuthHero
        heading={t("reset.heroHeading")}
        description={t("reset.heroDesc")}
      />
      <div className="fw">
        <form className="form" onSubmit={submit} onInput={(e) => setErrors((x) => ({ ...x, [(e.target as HTMLInputElement).name]: null }))} noValidate>
          <div className="auth-lang">
            <LanguageSwitcher />
          </div>
          <div>
            <h1>{t("reset.title")}</h1>
          </div>
          {!supabaseConfigured ? (
            <p className="warn" role="alert">{t("forgot.demo")}</p>
          ) : done ? (
            <>
              <p className="approval approved" role="status">{t("reset.done")}</p>
              <Link className="btn" href="/login" style={{ textAlign: "center" }}>
                {t("auth.logIn")}
              </Link>
            </>
          ) : hasSession === null ? (
            <p className="mute">{t("reset.checking")}</p>
          ) : !hasSession ? (
            <p className="warn" role="alert">
              {t("reset.needsLink")}{" "}
              <Link className="link" href="/forgot-password">
                {t("reset.requestNew")}
              </Link>
              .
            </p>
          ) : (
            <>
              <label>
                {t("profile.new")}
                <PasswordInput name="password" autoComplete="new-password" minLength={8} maxLength={72} placeholder={t("auth.pwPlaceholderNew")} required {...invalid("err-password", errors.password)} />
                <FieldError id="err-password" msg={errors.password} />
              </label>
              <p className="mute auth-pw-hint">{t("auth.pwRules")}</p>
              <label>
                {t("profile.confirm")}
                <PasswordInput name="confirm" autoComplete="new-password" minLength={8} maxLength={72} placeholder={t("auth.pwPlaceholderConfirm")} required {...invalid("err-confirm", errors.confirm)} />
                <FieldError id="err-confirm" msg={errors.confirm} />
              </label>
              {error && <p className="warn" role="alert">{error}</p>}
              <button className="btn" disabled={busy}>
                {busy ? t("auth.wait") : t("profile.update")}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
