import { createRoot } from "react-dom/client";
import { ContactsBoard } from "@/components/career/ContactsBoard";
async function mount() { const r = await fetch("/auth/me", { credentials: "include" }); if (!r.ok) return; createRoot(document.getElementById("react-root")!).render(<ContactsBoard />); }
void mount();
