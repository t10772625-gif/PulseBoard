"use client";
import { FormEvent, useState } from "react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { ROLE_INFO } from "@/lib/permissions";
import { Avatar } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

// Your own account: name, email, role and workspace; change display name and password.
export default function ProfilePage() {
  const { members, myRole, myEmail: email, workspaceName, realMode, updateMyName, toast } = useStore();
  const me = members.me;

  return (
    <>
      <div className="top">
        <div>
          <h1>Profile</h1>
          <p className="mute">Your account in {workspaceName || "this workspace"}.</p>
        </div>
      </div>

      {!realMode && (
        <p className="warn" role="status" style={{ marginBottom: 14 }}>
          Demo mode: profile editing needs the real database.
        </p>
      )}

      <div className="grid g2">
        <div className="card">
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
            <Avatar id="me" large />
            <div>
              <b>{me?.name ?? "You"}</b>
              <p className="mute">{email || "—"}</p>
            </div>
          </div>
          <p>
            <b>Role:</b> {myRole}
          </p>
          <p className="mute" style={{ marginBottom: 14 }}>
            {ROLE_INFO[myRole]}
          </p>
          <NameForm key={me?.name} initial={me?.name ?? ""} disabled={!realMode} onSave={updateMyName} onSaved={() => toast("Name updated")} />
        </div>

        <div className="card">
          <h2>Change password</h2>
          <PasswordForm email={email} disabled={!realMode} onDone={() => toast("Password updated")} />
        </div>
      </div>
    </>
  );
}

function NameForm({ initial, disabled, onSave, onSaved }: { initial: string; disabled: boolean; onSave: (n: string) => Promise<string | null>; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        Full name
        <input name="name" defaultValue={initial} maxLength={80} autoComplete="name" required disabled={disabled} />
      </label>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={busy || disabled} style={{ justifySelf: "start" }}>
        {busy ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

// Re-checks the current password before changing it, so an unattended signed-in
// browser can't be used to take over the account.
function PasswordForm({ email, disabled, onDone }: { email: string; disabled: boolean; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords don't match.");
    if (next === current) return setError("Choose a different password from your current one.");
    setBusy(true);
    const check = await sb.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setBusy(false);
      return setError(check.error.status === 429 ? "Too many attempts. Please wait and try again." : "Current password is incorrect.");
    }
    const { error: updateError } = await sb.auth.updateUser({ password: next });
    setBusy(false);
    if (updateError) return setError("Could not update your password. Please try again.");
    formEl.reset();
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label>
        Current password
        <PasswordInput name="current" autoComplete="current-password" required disabled={disabled} />
      </label>
      <label>
        New password
        <PasswordInput name="next" autoComplete="new-password" minLength={8} required disabled={disabled} />
      </label>
      <label>
        Confirm new password
        <PasswordInput name="confirm" autoComplete="new-password" minLength={8} required disabled={disabled} />
      </label>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={busy || disabled} style={{ justifySelf: "start" }}>
        {busy ? "Please wait…" : "Update password"}
      </button>
    </form>
  );
}
