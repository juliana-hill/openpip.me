import { createRoot } from "react-dom/client";
import { proxyFetch, redirectToLogin } from "@/lib/proxy";
import { CareerDashboard } from "@/components/career/CareerDashboard";
async function mount() { const r = await proxyFetch("/auth/me"); if (!r.ok) { redirectToLogin(); return; } const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<CareerDashboard userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
