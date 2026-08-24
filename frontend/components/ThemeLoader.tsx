"use client";
import { useEffect } from "react";
import { applyTheme } from "@/lib/theme";

// No localStorage: theme/accent are Drive-backed only. This applies the
// system default (see lib/theme.ts) until whatever page-level component
// fetches the real saved values from user_settings.json and corrects it.
export function ThemeLoader() {
  useEffect(() => {
    applyTheme("system", "coral");
  }, []);
  return null;
}
