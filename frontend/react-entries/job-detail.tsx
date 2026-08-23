import { createRoot } from "react-dom/client";
import { proxyFetch, redirectToLogin } from "@/lib/proxy";
import { AppHeader } from "@/components/app-header";
import { JobDetailPage } from "@/components/career/job-detail/JobDetailPage";
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) { redirectToLogin(); return; }
  const u = await r.json();
  const initials = (u.name ?? "?").charAt(0).toUpperCase();
  const jobId = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? "");
  createRoot(document.getElementById("react-root")!).render(
    <>
      <AppHeader userImage={u.picture ?? ""} userName={u.name ?? ""} initials={initials} />
      <JobDetailPage jobId={jobId} />
    </>,
  );
}
void mount();
