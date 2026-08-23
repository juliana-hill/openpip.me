import { createRoot } from "react-dom/client";
import { proxyFetch } from "@/lib/proxy";
import { TodayPage } from "@/components/dashboard/TodayPage";
async function mount() { const r = await proxyFetch("/auth/me"); if (!r.ok) return; const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<TodayPage userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
