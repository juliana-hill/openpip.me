import { createRoot } from "react-dom/client";
import { proxyFetch, redirectToLogin } from "@/lib/proxy";
import { AppHeader } from "@/components/app-header";
import { ContactDetailPage } from "@/components/network/contact-detail/ContactDetailPage";
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) { redirectToLogin(); return; }
  const u = await r.json();
  const name = u.name ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const contactId = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() ?? "");
  createRoot(document.getElementById("react-root")!).render(
    <>
      <AppHeader userImage={u.picture ?? ""} userName={name} initials={initials} pageTitle="Contact" />
      <ContactDetailPage contactId={contactId} />
    </>,
  );
}
void mount();
