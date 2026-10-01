import registry from "./locales.json";
import en from "./messages/en.json";
import { formatMessage, type MessageVars } from "./icu";

// i18n core. English is bundled and is the fallback for any missing key; every
// other language is a JSON file in public/locales/<code>.json, fetched when it is
// first used. Adding a language = that file + an entry in locales.json, no code.

export type LocaleInfo = {
  code: string;
  name: string;
  nativeName: string;
  intl: string;
  dir: "ltr" | "rtl";
  enabled: boolean;
  qa: "approved" | "in-review" | "draft";
};
export type MessageKey = keyof typeof en;
export type { MessageVars };

export const LOCALES = registry.locales as LocaleInfo[];
export const DEFAULT_LOCALE = "en";
const EN = en as Record<string, string>;

// Only languages that passed review (enabled) are offered to users
export const enabledLocales = () => LOCALES.filter((l) => l.enabled);
export const localeInfo = (code: string): LocaleInfo => LOCALES.find((l) => l.code === code) ?? LOCALES[0];
export const isSupportedLocale = (code: string | null | undefined): code is string => !!code && enabledLocales().some((l) => l.code === code);

const dictionaries: Record<string, Record<string, string>> = { en: EN };
const pending: Record<string, Promise<void> | undefined> = {};

export function isLocaleLoaded(code: string) {
  return !!dictionaries[code];
}

// Browser: fetch public/locales/<code>.json once. Unknown or failed → English stays.
export function loadLocale(code: string): Promise<void> {
  if (dictionaries[code] || !isSupportedLocale(code)) return Promise.resolve();
  pending[code] ??= fetch(`/locales/${code}.json`, { cache: "force-cache" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((d: Record<string, string>) => {
      dictionaries[code] = d;
    })
    .catch(() => {
      pending[code] = undefined;
    });
  return pending[code]!;
}

// Server (email, exports): register a dictionary that was read from disk
export function registerDictionary(code: string, dict: Record<string, string>) {
  dictionaries[code] = dict;
}

export function translate(code: string, key: MessageKey, vars?: MessageVars): string {
  const msg = dictionaries[code]?.[key] ?? EN[key];
  if (msg === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return formatMessage(msg, vars, localeInfo(code).intl);
}

// The language currently on screen, for code outside React components (store
// toasts, health labels, date helpers, rule-based suggestions). I18nProvider sets
// it on every render, so text built during a render uses the visible language.
let activeLocale = DEFAULT_LOCALE;
export function setActiveLocale(code: string) {
  activeLocale = code;
}
export function getActiveLocale() {
  return activeLocale;
}
export function tr(key: MessageKey, vars?: MessageVars): string {
  return translate(activeLocale, key, vars);
}
// For keys built from data (module names, custom values): translate when a key
// exists, otherwise show the fallback as written.
export function trOr(key: string, fallback: string, vars?: MessageVars): string {
  const has = dictionaries[activeLocale]?.[key] ?? EN[key];
  return has === undefined ? fallback : translate(activeLocale, key as MessageKey, vars);
}
// A "|"-separated message → list (suggested subtasks, test cases)
export function trList(key: MessageKey, vars?: MessageVars): string[] {
  return tr(key, vars).split("|").map((s) => s.trim());
}
export function activeFormatters() {
  return formatters(activeLocale);
}

// Locale-aware formatting (dates, times, numbers, currency, relative time)
export function formatters(code: string) {
  const loc = localeInfo(code).intl;
  return {
    date: (d: Date | number | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => new Intl.DateTimeFormat(loc, opts).format(new Date(d)),
    time: (d: Date | number | string, opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }) => new Intl.DateTimeFormat(loc, opts).format(new Date(d)),
    number: (n: number, opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(loc, opts).format(n),
    currency: (n: number, currency = "USD", opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(loc, { style: "currency", currency, maximumFractionDigits: n % 1 === 0 ? 0 : 2, ...opts }).format(n),
    relative: (value: number, unit: Intl.RelativeTimeFormatUnit) => new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(value, unit),
    list: (items: string[]) => new Intl.ListFormat(loc, { style: "long", type: "conjunction" }).format(items),
  };
}
export type Formatters = ReturnType<typeof formatters>;
