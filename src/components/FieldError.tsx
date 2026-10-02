"use client";
import type { FieldMsg } from "@/lib/validate";
import { useT } from "@/i18n/I18nProvider";

// Message under a form field. Give the input aria-invalid and aria-describedby={id}.
export default function FieldError({ id, msg }: { id: string; msg: FieldMsg | undefined }) {
  const { t } = useT();
  if (!msg) return null;
  return (
    <span id={id} className="field-err" role="alert">
      {t(msg.key, msg.values)}
    </span>
  );
}

// Props for an input that may have an error
export const invalid = (id: string, msg: FieldMsg | undefined) => (msg ? { "aria-invalid": true as const, "aria-describedby": id } : {});
