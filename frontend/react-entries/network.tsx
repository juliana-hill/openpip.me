import { createRoot } from "react-dom/client";
import { proxyFetch } from "@/lib/proxy";
import { ContactsBoard } from "@/components/career/ContactsBoard";
async function mount() { const r = await proxyFetch("/auth/me"); if (!r.ok) return; createRoot(document.getElementById("react-root")!).render(<ContactsBoard />); }
void mount();
