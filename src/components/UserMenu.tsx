"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/i18n/I18nProvider";
import { Avatar } from "./ui";

// Header account menu: who you are (name, role, email) and quick links.
export default function UserMenu() {
  const { members, myRole, myEmail, allowed, logout } = useStore();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const me = members.me;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-btn" aria-label={t("userMenu.label")} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar id="me" />
      </button>
      {open && (
        <div className="user-menu-pop" role="menu" aria-label={t("userMenu.account")}>
          <div className="user-menu-head">
            <Avatar id="me" />
            <div>
              <b>{me?.name ?? t("common.you")}</b>
              <span className="mute">{t(`role.${myRole}`)}</span>
              <span className="mute">{myEmail || "—"}</span>
            </div>
          </div>
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)}>
            <UserRound size={16} aria-hidden /> {t("userMenu.profile")}
          </Link>
          {allowed("page.settings") && (
            <Link role="menuitem" href="/settings" onClick={() => setOpen(false)}>
              <Settings size={16} aria-hidden /> {t("userMenu.settings")}
            </Link>
          )}
          <button
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push("/login");
            }}
          >
            <LogOut size={16} aria-hidden /> {t("common.logOut")}
          </button>
        </div>
      )}
    </div>
  );
}
