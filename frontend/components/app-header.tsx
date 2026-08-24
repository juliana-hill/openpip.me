"use client";

import Image from "next/image";
import Link from "next/link";
import { useAgentIdentity } from "@/lib/agentIdentity";
import { useThemeSync } from "@/lib/theme";
import styles from "./app-header.module.css";

type AppHeaderProps = Readonly<{
  userImage: string;
  userName: string;
  initials: string;
  pageTitle?: string;
  backHref?: string;
  backLabel?: string;
}>;

export function AppHeader({ userImage, userName, initials, backHref, backLabel }: AppHeaderProps) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const { name: agentName, icon: agentIcon, loading: identityLoading } = useAgentIdentity();
  // Present on every page that renders AppHeader, so this is the one shared
  // place that fetches and applies the saved theme/accent — same coverage
  // useAgentIdentity above gets for the name/icon.
  useThemeSync();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>

        <div className={styles.left}>
          {backHref && (
            <Link href={backHref} className={styles.backLink}>← {backLabel ?? "Back"}</Link>
          )}
          <span className={styles.date}>{today}</span>
        </div>

        <Link href="/" className={styles.logoLink}>
          {agentIcon
            ? <img src={agentIcon} alt={agentName} width={32} height={32} className={styles.logoImg} />
            : <Image src="/trippy-transparent.png" alt={agentName} width={32} height={32} className={styles.logoImg} />}
          {identityLoading
            ? <span className={styles.wordmarkSpinner} aria-label="Loading" role="status" />
            : <span className={styles.wordmark}>{agentName}</span>}
        </Link>

        <Link href="/settings" className={styles.avatarLink}>
          <div className={styles.avatar}>
            {userImage
              ? <img src={userImage} alt={userName} referrerPolicy="no-referrer" className={styles.avatarImg} />
              : <span>{initials}</span>}
          </div>
        </Link>

      </div>
    </header>
  );
}
