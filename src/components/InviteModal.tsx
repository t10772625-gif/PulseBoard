"use client";
import { FormEvent, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Member } from "@/types";
import { assignableRoles } from "@/lib/permissions";
import Dropdown from "./Dropdown";
import Modal from "./Modal";
import FieldError, { invalid } from "./FieldError";
import { v, type FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

export default function InviteModal() {
  const { inviteOpen, closeInviteModal, toast, realMode } = useStore();
  if (!inviteOpen) return null;
  return realMode ? <GrantAccess onClose={closeInviteModal} /> : <DemoInvite onClose={closeInviteModal} toast={toast} />;
}

// Real mode: pre-approve an email with a role. No email is sent yet (no SMTP);
// the admin tells the person to register with this exact email.
function GrantAccess({ onClose }: { onClose: () => void }) {
  const { addInvite, myRole, workspaceName } = useStore();
  const { t: tt, rich } = useT();
  const roles = assignableRoles(myRole);
  const [role, setRole] = useState<Member["role"]>("Member");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; role: Member["role"] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<FieldMsg>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    const problem = v.email(email);
    setEmailErr(problem);
    if (problem) return;
    setBusy(true);
    const err = await addInvite(email, role);
    setBusy(false);
    if (err) return setError(err);
    setDone({ email, role });
  }

  return (
    <Modal title={tt("invite.addTitle")} onClose={onClose}>
      {done ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p className="approval approved" role="status">
            {rich("invite.granted", { email: done.email, workspace: workspaceName, role: tt(`role.${done.role}`) })}
          </p>
          <p className="mute">{rich("invite.instructions", { url: `${typeof window !== "undefined" ? window.location.origin : ""}/register` })}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ghost" onClick={() => setDone(null)}>
              {tt("invite.addAnother")}
            </button>
            <button className="btn" onClick={onClose}>
              {tt("common.done")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }} noValidate>
          <p className="mute">{tt("invite.onlyNew")}</p>
          <label>
            {tt("common.email")}
            <input name="email" dir="ltr" type="email" autoComplete="off" maxLength={254} placeholder={tt("invite.emailPlaceholder")} required onInput={() => setEmailErr(null)} {...invalid("err-inv", emailErr)} />
            <FieldError id="err-inv" msg={emailErr} />
          </label>
          <label>
            {tt("common.role")}
            <Dropdown inline style={{ display: "block" }} value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: tt(`role.${r}`) }))} />
          </label>
          <p className="mute" style={{ fontSize: 12 }}>
            {tt(`roleInfo.${role}`)}
          </p>
          {error && (
            <p className="warn" role="alert">
              {error}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy ? tt("invite.wait") : tt("invite.grant")}
          </button>
        </form>
      )}
    </Modal>
  );
}

// Demo mode: unchanged sample invite link (UI prototype only)
function DemoInvite({ onClose, toast }: { onClose: () => void; toast: (m: string) => void }) {
  const [link] = useState(() => `https://pulseboard.app/invite/${Math.random().toString(36).slice(2, 10)}`);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t: tt } = useT();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast(tt("invite.linkCopied"));
    } catch {
      inputRef.current?.select();
      toast(tt("invite.pressCopy"));
    }
  }

  return (
    <Modal title={tt("invite.inviteTitle")} onClose={onClose}>
      <p className="mute">{tt("invite.demoNote")}</p>
      <p className="mute" style={{ fontSize: 12 }}>
        {tt("invite.demoLabel")}
      </p>
      <div className="invite-link">
        <input ref={inputRef} readOnly dir="ltr" value={link} onFocus={(e) => e.target.select()} />
        <button className="btn" onClick={copyLink}>
          {tt("invite.copyLink")}
        </button>
      </div>
    </Modal>
  );
}
