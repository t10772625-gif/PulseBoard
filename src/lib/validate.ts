import type { MessageKey } from "@/i18n";

// Form checks shown next to the field (the server / database checks again; these are
// for clear feedback, not security). Each rule returns a message key, or null when OK.
export type FieldMsg = { key: MessageKey; values?: Record<string, string | number> } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const v = {
  required: (value: string): FieldMsg => (value.trim() ? null : { key: "v.required" }),
  email: (value: string): FieldMsg => (!value.trim() ? { key: "v.required" } : EMAIL.test(value.trim()) && value.length <= 254 ? null : { key: "v.email" }),
  name: (value: string, max = 80): FieldMsg => {
    const t = value.trim();
    if (!t) return { key: "v.required" };
    if (t.length < 2) return { key: "v.tooShort", values: { n: 2 } };
    return t.length > max ? { key: "v.tooLong", values: { n: max } } : null;
  },
  text: (value: string, min: number, max: number): FieldMsg => {
    const t = value.trim();
    if (!t) return { key: "v.required" };
    if (t.length < min) return { key: "v.tooShort", values: { n: min } };
    return t.length > max ? { key: "v.tooLong", values: { n: max } } : null;
  },
  maxLen: (value: string, max: number): FieldMsg => (value.length > max ? { key: "v.tooLong", values: { n: max } } : null),
  password: (value: string): FieldMsg => {
    if (!value) return { key: "v.required" };
    if (value.length < 8) return { key: "auth.pwShort" };
    return /[A-Za-z]/.test(value) && /\d/.test(value) ? null : { key: "auth.pwMix" };
  },
  same: (a: string, b: string): FieldMsg => (!b ? { key: "v.required" } : a === b ? null : { key: "auth.pwMismatch" }),
};

// First problem of several rules for one field
export const first = (...msgs: FieldMsg[]): FieldMsg => msgs.find(Boolean) ?? null;

export const hasErrors = (errors: Record<string, FieldMsg>) => Object.values(errors).some(Boolean);
