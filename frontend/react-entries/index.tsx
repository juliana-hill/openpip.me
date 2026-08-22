import { createRoot } from "react-dom/client";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

async function mount() {
  const response = await fetch("/auth/me", { credentials: "include" });
  if (!response.ok) return;
  const user = await response.json();
  createRoot(document.getElementById("react-root")!).render(<DashboardPage userName={user.name ?? ""} userImage={user.picture ?? ""} />);
}
void mount();
