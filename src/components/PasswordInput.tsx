"use client";
import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";
import { useT } from "@/i18n/I18nProvider";

// Password field with a show/hide toggle. Visibility is local UI state only.
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  return (
    <span className="pw">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t("password.hide") : t("password.show")}
        aria-pressed={show}
        title={show ? t("password.hide") : t("password.show")}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
}
