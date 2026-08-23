import { createRoot } from "react-dom/client";
import { proxyFetch, redirectToLogin } from "@/lib/proxy";
import { NotebookDashboard } from "@/components/notebook/NotebookDashboard";
async function mount() { const r = await proxyFetch("/auth/me"); if (!r.ok) { redirectToLogin(); return; } const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<NotebookDashboard userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
