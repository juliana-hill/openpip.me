"use client";
import { useEffect } from "react";
import { loadSavedTheme, applyTheme } from "@/lib/theme";

export function ThemeLoader() {
  useEffect(() => {
    const { mode, accent } = loadSavedTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (mode === "system") applyTheme("system", accent); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return null;
}
