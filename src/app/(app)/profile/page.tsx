"use client";
import { FormEvent, useState } from "react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { useT } from "@/i18n/I18nProvider";

// Your own account: name, email, role and workspace; change display name and password.
export default function ProfilePage() {
  const { members, myRole, myEmail: email, workspaceName, realMode, updateMyName, toast } = useStore();
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
          <p>{rich("profile.role", { role: t(`role.${myRole}`) })}</p>
          <p className="mute" style={{ marginBottom: 14 }}>
            {t(`roleInfo.${myRole}`)}
          </p>
          <NameForm key={me?.name} initial={me?.name ?? ""} disabled={!realMode} onSave={updateMyName} onSaved={() => toast(t("profile.nameUpdated"))} />
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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await onSave(String(new FormData(e.currentTarget).get("name") ?? ""));
    setBusy(false);
    if (err) return setError(err);
    onSaved();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label>
        {t("auth.fullName")}
        <input name="name" defaultValue={initial} maxLength={80} autoComplete="name" required disabled={disabled} />
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
    if (next.length < 8) return setError(t("profile.newShort"));
    if (next !== confirm) return setError(t("profile.mismatch"));
    if (next === current) return setError(t("profile.same"));
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
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label>
        {t("profile.current")}
        <PasswordInput name="current" autoComplete="current-password" required disabled={disabled} />
      </label>
      <label>
        {t("profile.new")}
        <PasswordInput name="next" autoComplete="new-password" minLength={8} required disabled={disabled} />
      </label>
      <label>
        {t("profile.confirm")}
        <PasswordInput name="confirm" autoComplete="new-password" minLength={8} required disabled={disabled} />
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
