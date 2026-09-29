"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Modal from "./Modal";

export default function InviteModal() {
  const { inviteOpen, closeInviteModal, toast } = useStore();
  const [link] = useState(() => `https://pulseboard.app/invite/${Math.random().toString(36).slice(2, 10)}`);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!inviteOpen) return null;

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
    <Modal title="Invite a teammate" onClose={closeInviteModal}>
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
