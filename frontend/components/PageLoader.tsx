import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--color-text-muted)" }} />
    </div>
  );
}
