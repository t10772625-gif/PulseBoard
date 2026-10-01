"use client";
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { formatters, isLocaleLoaded, loadLocale, localeInfo, setActiveLocale, translate, type Formatters, type MessageKey, type MessageVars } from "./index";

type I18n = {
  locale: string;
  dir: "ltr" | "rtl";
  t: (key: MessageKey, vars?: MessageVars) => string;
  // Like t(), but <b>…</b> and <i>…</i> in the message become elements. Built as
  // React nodes from plain text (never HTML), so variables can't inject markup.
  rich: (key: MessageKey, vars?: MessageVars) => ReactNode;
  fmt: Formatters;
};

function toNodes(text: string): ReactNode {
  const parts = text.split(/(<b>[\s\S]*?<\/b>|<i>[\s\S]*?<\/i>)/g);
  return parts.map((p, i) => {
    const m = /^<(b|i)>([\s\S]*)<\/\1>$/.exec(p);
    if (!m) return <Fragment key={i}>{p}</Fragment>;
    return m[1] === "b" ? <b key={i}>{m[2]}</b> : <i key={i}>{m[2]}</i>;
  });
}

const Ctx = createContext<I18n | null>(null);

// Loads the chosen language, keeps <html lang dir> in sync, and gives components
// t() and locale-aware formatters. Until a language file has loaded, English shows.
export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = useStore();
  const [loaded, setLoaded] = useState(() => isLocaleLoaded(language));
  const [lastLanguage, setLastLanguage] = useState(language);
  if (lastLanguage !== language) {
    setLastLanguage(language);
    setLoaded(isLocaleLoaded(language));
  }

  useEffect(() => {
    let alive = true;
    loadLocale(language).then(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [language]);

  // Text direction follows the language that is actually showing
  const active = loaded ? language : "en";
  // Code outside components (tr(), date helpers) follows the same language
  setActiveLocale(active);
  const info = localeInfo(active);
  useEffect(() => {
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.dir;
  }, [info.code, info.dir]);

  const t = useCallback((key: MessageKey, vars?: MessageVars) => translate(active, key, vars), [active]);
  const rich = useCallback((key: MessageKey, vars?: MessageVars) => toNodes(translate(active, key, vars)), [active]);
  const value = useMemo<I18n>(() => ({ locale: active, dir: info.dir, t, rich, fmt: formatters(active) }), [active, info.dir, t, rich]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useT must be used inside <I18nProvider>");
  return v;
}
