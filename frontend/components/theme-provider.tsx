"use client";

import type { ReactNode } from "react";

// Theme provider is a no-op — theming is handled via CSS custom properties.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
