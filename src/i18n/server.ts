// Server only: uses node:fs, so importing it from a client component fails the build.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALE, isLocaleLoaded, isSupportedLocale, localeInfo, registerDictionary, translate, type MessageKey, type MessageVars } from "./index";

// Server-side translations (email templates, exports). The language file is read
// from public/locales only for a code that is in the registry, so the request
// can't choose an arbitrary path. Unknown codes and read errors fall back to English.
export async function serverTranslator(requested: unknown) {
  const code = typeof requested === "string" && isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;
  if (code !== DEFAULT_LOCALE && !isLocaleLoaded(code)) {
    try {
      const file = path.join(process.cwd(), "public", "locales", `${code}.json`);
      registerDictionary(code, JSON.parse(await readFile(file, "utf8")) as Record<string, string>);
    } catch {
      return { locale: DEFAULT_LOCALE, dir: "ltr" as const, t: (key: MessageKey, vars?: MessageVars) => translate(DEFAULT_LOCALE, key, vars) };
    }
  }
  return { locale: code, dir: localeInfo(code).dir, t: (key: MessageKey, vars?: MessageVars) => translate(code, key, vars) };
}
