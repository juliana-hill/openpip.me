import { createRoot } from "react-dom/client";
import { NotebookDashboard } from "@/components/notebook/NotebookDashboard";
async function mount() { const r = await fetch("/auth/me", { credentials: "include" }); if (!r.ok) return; const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<NotebookDashboard userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
