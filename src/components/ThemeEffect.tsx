"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function ThemeEffect() {
  const { theme } = useStore();
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);
  return null;
}
