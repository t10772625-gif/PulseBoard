"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { DEFAULT_BRAND_NAME, isSafeLogo } from "@/lib/branding";

// The brand the app shows: the workspace's own name/logo when its plan includes
// white-label branding (ADV-02), otherwise PulseBoard. Display only — grants nothing.
export function useBrand(): { name: string; logo: string; custom: boolean } {
  const { branding, can } = useStore();
  if (!can("ADV-02")) return { name: DEFAULT_BRAND_NAME, logo: "", custom: false };
  const name = branding.name.trim() || DEFAULT_BRAND_NAME;
  const logo = isSafeLogo(branding.logo) ? branding.logo : "";
  return { name, logo, custom: name !== DEFAULT_BRAND_NAME || !!logo };
}

// Browser tab: "<page heading> · <brand>" and the brand logo as the favicon.
// Falls back to PulseBoard and the default icon.
export default function BrandEffect() {
  const { name, logo } = useBrand();
  const pathname = usePathname();
  const defaultIcons = useRef<Map<HTMLLinkElement, string>>(new Map());

  useEffect(() => {
    const apply = () => {
      const heading = document.querySelector("main h1, .main h1, h1")?.textContent?.trim();
      const next = heading && heading !== name ? `${heading} · ${name}` : name;
      if (document.title !== next) document.title = next;
    };
    const frame = requestAnimationFrame(apply);
    // Next.js may reset the title after navigation; put ours back when it does
    const titleEl = document.querySelector("title");
    const observer = titleEl ? new MutationObserver(apply) : null;
    if (titleEl && observer) observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [name, pathname]);

  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    for (const l of links) if (!defaultIcons.current.has(l)) defaultIcons.current.set(l, l.href);
    for (const l of links) l.href = logo || defaultIcons.current.get(l) || l.href;
  }, [logo]);

  return null;
}
