import { useMemo } from "react";

export function usePathname() {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

export function useSearchParams() {
  return useMemo(() => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search), []);
}

// Every dynamic route this app actually has is a single trailing [id]
// segment (/review/[id], /career/jobs/[id], /network/contacts/[id]) — there
// is no Next.js file-based router here to read the real segment name from,
// so the last non-empty path segment is exposed as `id`, which covers all
// three. A second dynamic segment name would need this taught explicitly.
export function useParams() {
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  return useMemo(() => {
    const id = pathname.split("/").filter(Boolean).pop() ?? "";
    return { id } as Record<string, string>;
  }, [pathname]);
}

export function useRouter() {
  return useMemo(() => ({
    push: (href: string) => { window.location.href = href; },
    replace: (href: string) => { window.location.replace(href); },
    back: () => window.history.back(),
    refresh: () => window.location.reload(),
  }), []);
}
