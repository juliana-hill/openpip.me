import { createRoot } from "react-dom/client";
import { RoutesPage } from "@/components/routes/RoutesPage";
async function mount() { const r = await fetch("/auth/me", { credentials: "include" }); if (!r.ok) return; const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<RoutesPage userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
