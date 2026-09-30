"use client";
import { FormEvent, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Member } from "@/types";
import { ROLE_INFO, assignableRoles } from "@/lib/permissions";
import Dropdown from "./Dropdown";
import Modal from "./Modal";

export default function InviteModal() {
  const { inviteOpen, closeInviteModal, toast, realMode } = useStore();
  if (!inviteOpen) return null;
  return realMode ? <GrantAccess onClose={closeInviteModal} /> : <DemoInvite onClose={closeInviteModal} toast={toast} />;
}

// Real mode: pre-approve an email with a role. No email is sent yet (no SMTP);
// the admin tells the person to register with this exact email.
function GrantAccess({ onClose }: { onClose: () => void }) {
  const { addInvite, myRole, workspaceName } = useStore();
  const roles = assignableRoles(myRole);
  const [role, setRole] = useState<Member["role"]>("Member");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; role: Member["role"] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    setBusy(true);
    const err = await addInvite(email, role);
    setBusy(false);
    if (err) return setError(err);
    setDone({ email, role });
  }

  return (
    <Modal title="Add a teammate" onClose={onClose}>
      {done ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p className="approval approved" role="status">
            Access granted: <b>{done.email}</b> will join <b>{workspaceName}</b> as <b>{done.role}</b>.
          </p>
          <p className="mute">
            Ask them to open <b>{typeof window !== "undefined" ? window.location.origin : ""}/register</b> and sign up with this exact email and a password of their choice. The
            access expires in 7 days if unused. No email is sent yet.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ghost" onClick={() => setDone(null)}>
              Add another
            </button>
            <button className="btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <p className="mute">Only for people who don&apos;t have a PulseBoard account yet. They join this workspace when they sign up with this email.</p>
          <label>
            Email
            <input name="email" type="email" autoComplete="off" maxLength={254} required />
          </label>
          <label>
            Role
            <Dropdown inline style={{ display: "block" }} value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: r }))} />
          </label>
          <p className="mute" style={{ fontSize: 12 }}>
            {ROLE_INFO[role]}
          </p>
          {error && (
            <p className="warn" role="alert">
              {error}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy ? "Please wait…" : "Grant access"}
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast("Invite link copied");
    } catch {
      inputRef.current?.select();
      toast("Press Ctrl+C to copy");
    }
  }

  return (
    <Modal title="Invite a teammate" onClose={onClose}>
      <p className="mute">Anyone with this link can join your workspace. Share it over chat or email.</p>
      <div className="invite-link">
        <input ref={inputRef} readOnly value={link} onFocus={(e) => e.target.select()} />
        <button className="btn" onClick={copyLink}>
          Copy link
        </button>
      </div>
    </Modal>
  );
}
