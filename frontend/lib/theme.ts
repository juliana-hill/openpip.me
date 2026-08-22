export type AccentColor = "coral" | "blue" | "green" | "red" | "lilac";
export type ThemeMode = "light" | "dark" | "system";

let systemMediaQuery: MediaQueryList | null = null;
let systemMediaHandler: (() => void) | null = null;

export function applyTheme(mode: ThemeMode, accent: AccentColor) {
  const root = document.documentElement;
  const isDark = mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : mode === "dark";
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  root.setAttribute("data-accent", accent);
  root.style.colorScheme = isDark ? "dark" : "light";

  if (systemMediaQuery && systemMediaHandler) {
    systemMediaQuery.removeEventListener("change", systemMediaHandler);
    systemMediaQuery = null;
    systemMediaHandler = null;
  }
  if (mode === "system") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const nextIsDark = media.matches;
      root.setAttribute("data-theme", nextIsDark ? "dark" : "light");
      root.style.colorScheme = nextIsDark ? "dark" : "light";
    };
    media.addEventListener("change", handler);
    systemMediaQuery = media;
    systemMediaHandler = handler;
  }

  localStorage.setItem("theme-mode", mode);
  localStorage.setItem("theme-accent", accent);
}

export function loadSavedTheme() {
  const mode = (localStorage.getItem("theme-mode") ?? "system") as ThemeMode;
  const accent = (localStorage.getItem("theme-accent") ?? "coral") as AccentColor;
  applyTheme(mode, accent);
  return { mode, accent };
}
