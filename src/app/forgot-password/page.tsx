"use client";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { AuthHero } from "@/components/AuthHero";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FieldError, { invalid } from "@/components/FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

function ForgotForm() {
  const linkError = useSearchParams().get("error") === "link";
  const { t } = useT();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<FieldMsg>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const problem = v.email(email);
    setEmailErr(problem);
    if (problem) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // Only rate limiting is surfaced; every other outcome shows the same message
    // so the form can't be used to find out which emails have accounts.
    if (error && error.status === 429) return setError(t("forgot.tooMany"));
    setSent(true);
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="auth-lang">
        <LanguageSwitcher />
      </div>
      <div>
        <h1>{t("forgot.title")}</h1>
        <p className="mute">{t("forgot.hint")}</p>
      </div>
      {!supabaseConfigured ? (
        <p className="warn" role="alert">{t("forgot.demo")}</p>
      ) : sent ? (
        <p className="approval approved" role="status">
          {t("forgot.sent")}
        </p>
      ) : (
        <>
          {linkError && (
            <p className="warn" role="alert">{t("forgot.linkInvalid")}</p>
          )}
          <label>
            {t("common.email")}
            <input name="email" type="email" dir="ltr" autoComplete="email" maxLength={254} placeholder={t("auth.emailPlaceholder")} required onInput={() => setEmailErr(null)} {...invalid("err-email", emailErr)} />
            <FieldError id="err-email" msg={emailErr} />
          </label>
          {error && <p className="warn" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? t("auth.wait") : t("forgot.send")}
          </button>
        </>
      )}
      <p className="mute" style={{ textAlign: "center" }}>
        {t("forgot.remembered")}{" "}
        <Link className="link" href="/login">
          {t("auth.logIn")}
        </Link>
      </p>
    </form>
  );
}

export default function Page() {
  const { t } = useT();
  return (
    <section className="auth">
      <AuthHero
        heading={t("forgot.heroHeading")}
        description={t("forgot.heroDesc")}
      />
      <div className="fw">
        <Suspense>
          <ForgotForm />
        </Suspense>
      </div>
    </section>
  );
}
