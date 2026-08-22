"use client";

import { PageShell } from "@/components/ui/PageShell";
import { AppHeader } from "@/components/app-header";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";

type Props = Readonly<{
  userName: string;
  userImage: string;

  showHistory?: boolean;
  showCalendar?: boolean;
}>;

export function RoutesPage({ userName, userImage }: Props) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Routes" />
      <PageShell>
        <section
          aria-labelledby="routes-tbd-title"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            background: "var(--color-surface)",
            padding: "clamp(24px, 5vw, 48px)",
            minHeight: 240,
            display: "grid",
            alignContent: "center",
            gap: 12,
          }}
        >
          <span style={{ color: "var(--color-text-muted)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Travel planning
          </span>
          <h1 id="routes-tbd-title" style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)" }}>
            TBD
          </h1>
          <p style={{ margin: 0, maxWidth: 620, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Route planning is being redesigned for OpenPip. The existing route components are preserved for reuse.
          </p>
        </section>
      </PageShell>
      <FloatingAssistant />
    </>
  );
}
