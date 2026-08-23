"use client";

import { AppearanceSection } from "./AppearanceSection";
import { AgentSection } from "./AgentSection";
import { AddressSection } from "./AddressSection";
import { ConnectorSection } from "./ConnectorSection";
import { NotificationSoundSection } from "./NotificationSoundSection";
import { AgentGuidelinesSection } from "./AgentGuidelinesSection";
import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/ui/PageShell";
import styles from "./SettingsPage.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import { proxyFetch } from "@/lib/proxy";
import { clearSession } from "@/lib/session";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";

type SettingsPageProps = Readonly<{
  userEmail: string;
  userName: string;
  userImage: string;

}>;

export function SettingsPage({ userEmail, userName, userImage }: SettingsPageProps) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Settings" />
      <PageShell>
        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Settings</h1>
              <p className={styles.subtitle}>Manage your preferences and saved locations.</p>
            </div>
          </div>
          <div className={styles.heroDivider} />
          <div className={styles.heroBottom}>
            <AppearanceSection />
            <AgentSection />
          </div>
        </div>

        <div className={styles.sections}>
          <AgentGuidelinesSection />
          <AddressSection />
          <ConnectorSection />
          <NotificationSoundSection />
        </div>

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-start" }}>
          <button
            className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.md}`}
            onClick={() => proxyFetch("/auth/logout", { method: "POST" }).finally(() => { clearSession(); window.location.href = "/login"; })}
          >
            Log out
          </button>
        </div>
      </PageShell>
      <FloatingAssistant />
    </>
  );
}
