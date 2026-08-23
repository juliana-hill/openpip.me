import { createRoot } from "react-dom/client";
import { proxyFetch } from "@/lib/proxy";
import { SettingsPage } from "@/components/settings/SettingsPage";
async function mount() { const r = await proxyFetch("/auth/me"); if (!r.ok) return; const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<SettingsPage userEmail={u.email ?? ""} userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
