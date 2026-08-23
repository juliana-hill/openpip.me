import { createRoot } from "react-dom/client";
import { proxyFetch, redirectToLogin } from "@/lib/proxy";
import { ContactsBoard } from "@/components/career/ContactsBoard";
async function mount() { const r = await proxyFetch("/auth/me"); if (!r.ok) { redirectToLogin(); return; } createRoot(document.getElementById("react-root")!).render(<ContactsBoard />); }
void mount();
