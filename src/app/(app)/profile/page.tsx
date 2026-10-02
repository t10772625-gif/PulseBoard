"use client";
import { FormEvent, useState } from "react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import Dropdown from "@/components/Dropdown";
import type { ProfileDetails } from "@/types";
import FieldError, { invalid } from "@/components/FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

// Your own account: name, email, role and workspace; change display name and password.
export default function ProfilePage() {
  const { members, myRole, myEmail: email, workspaceName, realMode, updateMyName, toast, profile, updateProfileDetails, isCreator } = useStore();
  const me = members.me;
  const { t, rich } = useT();

  return (
    <>
      <div className="top">
        <div>
          <h1>{t("profile.title")}</h1>
          <p className="mute">{t("profile.yourAccount", { workspace: workspaceName || t("profile.thisWorkspace") })}</p>
        </div>
      </div>

      {!realMode && (
        <p className="warn" role="status" style={{ marginBottom: 14 }}>
          {t("profile.demo")}
        </p>
      )}

      <div className="grid g2">
        <div className="card">
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
            <Avatar id="me" large />
            <div>
              <b>{me?.name ?? t("common.you")}</b>
              <p className="mute" dir="ltr">{email || "—"}</p>
            </div>
          </div>
          <p>
            {rich("profile.role", { role: t(`role.${myRole}`) })}
            {isCreator && <span className="chip" style={{ marginInlineStart: 6 }}>{t("team.creator")}</span>}
          </p>
          <p className="mute" style={{ marginBottom: 14 }}>
            {t(`roleInfo.${myRole}`)}
          </p>
          <NameForm key={me?.name} initial={me?.name ?? ""} disabled={!realMode} onSave={updateMyName} onSaved={() => toast(t("profile.nameUpdated"))} />
        </div>

        <div className="card">
          <h2>{t("profile.aboutYou")}</h2>
          <DetailsForm key={JSON.stringify(profile)} initial={profile} disabled={!realMode} onSave={updateProfileDetails} onSaved={() => toast(t("profile.detailsUpdated"))} />
        </div>

        <div className="card">
          <h2>{t("profile.changePassword")}</h2>
          <PasswordForm email={email} disabled={!realMode} onDone={() => toast(t("profile.pwUpdated"))} />
        </div>
      </div>
    </>
  );
}

function NameForm({ initial, disabled, onSave, onSaved }: { initial: string; disabled: boolean; onSave: (n: string) => Promise<string | null>; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useT();

  const [nameErr, setNameErr] = useState<FieldMsg>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const name = String(new FormData(e.currentTarget).get("name") ?? "");
    const problem = v.name(name);
    setNameErr(problem);
    if (problem) return;
    setBusy(true);
    const err = await onSave(name);
    setBusy(false);
    if (err) return setError(err);
    onSaved();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }} noValidate>
      <label>
        {t("auth.fullName")}
        <input name="name" defaultValue={initial} maxLength={80} autoComplete="name" placeholder={t("auth.namePlaceholder")} required disabled={disabled} onInput={() => setNameErr(null)} {...invalid("err-pname", nameErr)} />
        <FieldError id="err-pname" msg={nameErr} />
      </label>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={busy || disabled} style={{ justifySelf: "start" }}>
        {busy ? t("profile.saving") : t("profile.saveName")}
      </button>
    </form>
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
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }} onInput={(e) => setErrors((x) => ({ ...x, [(e.target as HTMLInputElement).name]: null }))} noValidate>
      <label>
        {t("profile.current")}
        <PasswordInput name="current" autoComplete="current-password" maxLength={72} placeholder={t("auth.pwPlaceholder")} required disabled={disabled} {...invalid("err-cur", errors.current)} />
        <FieldError id="err-cur" msg={errors.current} />
      </label>
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
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={busy || disabled} style={{ justifySelf: "start" }}>
        {busy ? t("auth.wait") : t("profile.update")}
      </button>
    </form>
  );
}

// Same allow-lists as sign-up and the profiles CHECK constraints (21_simplify-roles …2150)
const TEAM_SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;
const USE_CASES = ["software", "agency", "marketing", "operations", "personal", "other"] as const;

function DetailsForm({ initial, disabled, onSave, onSaved }: { initial: ProfileDetails; disabled: boolean; onSave: (d: ProfileDetails) => Promise<string | null>; onSaved: () => void }) {
  const { t } = useT();
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await onSave({ ...d, jobTitle: d.jobTitle.slice(0, 80) });
    setBusy(false);
    if (err) return setError(err);
    onSaved();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label>
        {t("auth.jobTitle")}
        <input value={d.jobTitle} maxLength={80} placeholder={t("auth.jobPlaceholder")} disabled={disabled} onChange={(e) => setD({ ...d, jobTitle: e.target.value })} />
      </label>
      <label>
        {t("auth.teamSize")}
        <Dropdown value={d.teamSize} disabled={disabled} onChange={(v) => setD({ ...d, teamSize: v })} options={[{ value: "", label: t("auth.choose") }, ...TEAM_SIZES.map((v) => ({ value: v, label: t(`auth.team.${v}`) }))]} />
      </label>
      <label>
        {t("auth.useCase")}
        <Dropdown value={d.useCase} disabled={disabled} onChange={(v) => setD({ ...d, useCase: v })} options={[{ value: "", label: t("auth.choose") }, ...USE_CASES.map((v) => ({ value: v, label: t(`auth.use.${v}`) }))]} />
      </label>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={disabled || busy}>
        {busy ? t("auth.wait") : t("common.save")}
      </button>
    </form>
  );
}
