import { createRoot } from "react-dom/client";
import { CalendarPage } from "@/components/calendar/CalendarPage";
async function mount() { const r = await fetch("/auth/me", { credentials: "include" }); if (!r.ok) return; const u = await r.json(); createRoot(document.getElementById("react-root")!).render(<CalendarPage userName={u.name ?? ""} userImage={u.picture ?? ""} />); }
void mount();
