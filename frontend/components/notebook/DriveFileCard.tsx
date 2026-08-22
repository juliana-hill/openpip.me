"use client";

import styles from "./NotebookDashboard.module.css";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string;
};

function fileIcon(mimeType: string): { icon: string; colorClass: string } {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return { icon: "📊", colorClass: styles.driveIconGreen };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return { icon: "📽️", colorClass: styles.driveIconYellow };
  if (mimeType.includes("pdf")) return { icon: "📄", colorClass: styles.driveIconRed };
  return { icon: "📝", colorClass: styles.driveIconBlue };
}

function formatModified(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Modified just now";
  if (diffHours < 24) return `Modified ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Modified ${diffDays}d ago`;
  return `Modified ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

type Props = Readonly<{ file: DriveFile }>;

export function DriveFileCard({ file }: Props) {
  const { icon, colorClass } = fileIcon(file.mimeType);

  function handleClick() {
    window.open(file.webViewLink, "_blank", "noopener,noreferrer");
  }

  return (
    <button className={styles.driveCard} onClick={handleClick} type="button" aria-label={`Open ${file.name} in Google Drive`}>
      <div className={`${styles.driveCardIconBadge} ${colorClass}`}>{icon}</div>
      <div className={styles.driveCardBottom}>
        <p className={styles.driveCardName}>{file.name}</p>
        <p className={styles.driveCardMeta}>{formatModified(file.modifiedTime)}</p>
      </div>
      <span className={styles.driveCardLinkIcon} aria-hidden>↗</span>
    </button>
  );
}
