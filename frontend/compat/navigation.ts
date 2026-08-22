import { useMemo } from "react";

export function usePathname() {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

export function useSearchParams() {
  return useMemo(() => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search), []);
}

export function useParams() {
  return useMemo(() => ({} as Record<string, string>), []);
}

export function useRouter() {
  return useMemo(() => ({
    push: (href: string) => { window.location.href = href; },
    replace: (href: string) => { window.location.replace(href); },
    back: () => window.history.back(),
    refresh: () => window.location.reload(),
  }), []);
}
