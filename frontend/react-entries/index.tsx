import { createRoot } from "react-dom/client";
import { proxyFetch, redirectToLogin } from "@/lib/proxy";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

async function mount() {
  const response = await proxyFetch("/auth/me");
  if (!response.ok) { redirectToLogin(); return; }
  const user = await response.json();
  createRoot(document.getElementById("react-root")!).render(<DashboardPage userName={user.name ?? ""} userImage={user.picture ?? ""} />);
}
void mount();
