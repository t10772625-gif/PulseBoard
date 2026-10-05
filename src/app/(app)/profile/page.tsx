"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ChevronRight, KeyRound, Languages, Lock, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import Dropdown from "@/components/Dropdown";
import type { ProfileDetails } from "@/types";
import FieldError, { invalid } from "@/components/FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

// Your own account: who you are in this workspace (role shown once, in the header),
// your personal details, your password, and links to the related settings.
export default function ProfilePage() {
  const { members, myRole, myEmail: email, workspaceName, realMode, updateMyName, toast, profile, updateProfileDetails } = useStore();
  const me = members.me;
  const { t } = useT();

  return (
    <>
      <div className="top">
        <div>
          <h1>{t("profile.title")}</h1>
          <p className="mute">{t("profile.yourAccount", { workspace: workspaceName || t("profile.thisWorkspace") })}</p>
        </div>
      </div>

      <div className="ux-page">
        {!realMode && (
          <p className="st-demo-warn" role="status" style={{ margin: 0 }}>
            <Lock size={14} aria-hidden /> {t("profile.demo")}
          </p>
        )}

        <section className="card ux-hero" aria-labelledby="pf-name">
          <Avatar id="me" large />
          <div className="ux-hero-main">
            <div className="ux-pills">
              <span className="st-pill">{t(`role.${myRole}`)}</span>
            </div>
            <h2 id="pf-name">{me?.name ?? t("common.you")}</h2>
            <p className="mute" dir="ltr" style={{ textAlign: "start" }}>
              {email || "—"}
            </p>
            <p className="mute" style={{ fontSize: 13 }}>
              {t(`roleInfo.${myRole}`)}
            </p>
          </div>
        </section>

        <div className="grid g2">
          <section className="card ux-sec" aria-labelledby="pf-details">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <UserRound size={18} />
              </span>
              <h2 id="pf-details">{t("profile.personal")}</h2>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {t("profile.personalHint")}
            </p>
            <DetailsForm
              key={`${me?.name}|${JSON.stringify(profile)}`}
              initialName={me?.name ?? ""}
              initial={profile}
              disabled={!realMode}
              onSaveName={updateMyName}
              onSave={updateProfileDetails}
              onSaved={() => toast(t("profile.detailsUpdated"))}
            />
          </section>

          <section className="card ux-sec" aria-labelledby="pf-pw">
            <div className="ux-sec-head">
              <span className="ux-icon sm" aria-hidden>
                <KeyRound size={18} />
              </span>
              <h2 id="pf-pw">{t("profile.changePassword")}</h2>
            </div>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>
              {t("profile.passwordHint")}
            </p>
            <PasswordForm email={email} disabled={!realMode} onDone={() => toast(t("profile.pwUpdated"))} />
          </section>
        </div>

        <section className="card ux-sec" aria-labelledby="pf-more">
          <h2 id="pf-more" style={{ margin: 0, fontSize: 17 }}>
            {t("profile.more")}
          </h2>
          <div className="ux-rows">
            <div className="st-row">
              <span className="st-ic" aria-hidden>
                <Lock size={18} />
              </span>
              <div className="st-row-main">
                <b>{t("profile.secRow")}</b>
                <p className="mute">{t("profile.secRowHint")}</p>
              </div>
              <Link className="ghost sm" href="/settings/security">
                {t("profile.open")} <ChevronRight size={14} aria-hidden className="flip-rtl" />
              </Link>
            </div>
            <div className="st-row">
              <span className="st-ic" aria-hidden>
                <Languages size={18} />
              </span>
              <div className="st-row-main">
                <b>{t("profile.langRow")}</b>
                <p className="mute">{t("profile.langRowHint")}</p>
              </div>
              <Link className="ghost sm" href="/settings/language">
                {t("profile.open")} <ChevronRight size={14} aria-hidden className="flip-rtl" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// Re-checks the current password before changing it, so an unattended signed-in
// browser can't be used to take over the account.
function PasswordForm({ email, disabled, onDone }: { email: string; disabled: boolean; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, FieldMsg>>({});
  const [busy, setBusy] = useState(false);
  const { t } = useT();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const sb = getSupabase();
    if (!sb || !email) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const found: Record<string, FieldMsg> = {
      current: v.required(current),
      next: v.password(next) ?? (next === current ? { key: "profile.same" } : null),
      confirm: v.same(next, confirm),
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setBusy(true);
    const check = await sb.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setBusy(false);
      return setError(check.error.status === 429 ? t("profile.tooMany") : t("profile.wrongCurrent"));
    }
    const { error: updateError } = await sb.auth.updateUser({ password: next });
    setBusy(false);
    if (updateError) return setError(t("profile.updateFailed"));
    formEl.reset();
    onDone();
  }

  return (
    <form className="ux-form" onSubmit={submit} onInput={(e) => setErrors((x) => ({ ...x, [(e.target as HTMLInputElement).name]: null }))} noValidate>
      <label>
        {t("profile.current")}
        <PasswordInput name="current" autoComplete="current-password" maxLength={72} placeholder={t("auth.pwPlaceholder")} required disabled={disabled} {...invalid("err-cur", errors.current)} />
        <FieldError id="err-cur" msg={errors.current} />
      </label>
      <div className="ux-form-2">
        <label>
          {t("profile.new")}
          <PasswordInput name="next" autoComplete="new-password" minLength={8} maxLength={72} placeholder={t("auth.pwPlaceholderNew")} required disabled={disabled} {...invalid("err-next", errors.next)} />
          <FieldError id="err-next" msg={errors.next} />
        </label>
        <label>
          {t("profile.confirm")}
          <PasswordInput name="confirm" autoComplete="new-password" minLength={8} maxLength={72} placeholder={t("auth.pwPlaceholderConfirm")} required disabled={disabled} {...invalid("err-conf", errors.confirm)} />
          <FieldError id="err-conf" msg={errors.confirm} />
        </label>
      </div>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <div className="ux-actions">
        <button className="btn" disabled={busy || disabled}>
          {busy ? t("auth.wait") : t("profile.update")}
        </button>
      </div>
    </form>
  );
}

// Same allow-lists as sign-up and the profiles CHECK constraints (21_simplify-roles …2150)
const TEAM_SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;
const USE_CASES = ["software", "agency", "marketing", "operations", "personal", "other"] as const;

// Name + job title + team size + use case in one form. The name and the details
// are saved by their own existing calls; only what changed is sent.
function DetailsForm({
  initialName,
  initial,
  disabled,
  onSaveName,
  onSave,
  onSaved,
}: {
  initialName: string;
  initial: ProfileDetails;
  disabled: boolean;
  onSaveName: (n: string) => Promise<string | null>;
  onSave: (d: ProfileDetails) => Promise<string | null>;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initialName);
  const [nameErr, setNameErr] = useState<FieldMsg>(null);
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const problem = v.name(name);
    setNameErr(problem);
    if (problem) return;
    setBusy(true);
    let err: string | null = null;
    if (name.trim() !== initialName.trim()) err = await onSaveName(name);
    if (!err && JSON.stringify(d) !== JSON.stringify(initial)) err = await onSave({ ...d, jobTitle: d.jobTitle.slice(0, 80) });
    setBusy(false);
    if (err) return setError(err);
    onSaved();
  }

  return (
    <form className="ux-form" onSubmit={submit} noValidate>
      <div className="ux-form-2">
        <label>
          {t("auth.fullName")}
          <input
            name="name"
            value={name}
            maxLength={80}
            autoComplete="name"
            placeholder={t("auth.namePlaceholder")}
            required
            disabled={disabled}
            onChange={(e) => {
              setName(e.target.value);
              setNameErr(null);
            }}
            {...invalid("err-pname", nameErr)}
          />
          <FieldError id="err-pname" msg={nameErr} />
        </label>
        <label>
          {t("profile.jobTitle")}
          <input value={d.jobTitle} maxLength={80} autoComplete="organization-title" placeholder={t("auth.jobPlaceholder")} disabled={disabled} onChange={(e) => setD({ ...d, jobTitle: e.target.value })} />
        </label>
        <label>
          {t("auth.teamSize")}
          <Dropdown value={d.teamSize} disabled={disabled} onChange={(x) => setD({ ...d, teamSize: x })} options={[{ value: "", label: t("auth.choose") }, ...TEAM_SIZES.map((x) => ({ value: x, label: t(`auth.team.${x}`) }))]} />
        </label>
        <label>
          {t("auth.useCase")}
          <Dropdown value={d.useCase} disabled={disabled} onChange={(x) => setD({ ...d, useCase: x })} options={[{ value: "", label: t("auth.choose") }, ...USE_CASES.map((x) => ({ value: x, label: t(`auth.use.${x}`) }))]} />
        </label>
      </div>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <div className="ux-actions">
        <button className="btn" disabled={disabled || busy}>
          {busy ? t("profile.saving") : t("profile.saveChanges")}
        </button>
      </div>
    </form>
  );
}
