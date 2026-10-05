"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { pagePermissionsFor } from "@/lib/permissions";
import { SETTINGS_PAGES } from "@/lib/settings-nav";

// Settings has no page of its own: the sidebar's Settings group lists the
// sub-pages, and links to /settings (user menu, command palette) open the first
// one this role may open (a Member lands on Security, an Admin on Plan).
export default function Settings() {
  const { allowed } = useStore();
  const router = useRouter();
  const target = SETTINGS_PAGES.find((p) => pagePermissionsFor(p.href).every((k) => allowed(k)));
  useEffect(() => {
    if (target) router.replace(target.href);
  }, [router, target]);
  return null;
}
