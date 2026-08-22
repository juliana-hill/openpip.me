import type { EmailGroup } from "./InboxTab";
import styles from "./SenderGroupHeader.module.css";

type Props = {
  group: EmailGroup;
  unreadCount: number;
  expanded: boolean;
  onToggle: () => void;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function SenderGroupHeader({ group, unreadCount, expanded, onToggle }: Props) {
  return (
    <div className={styles.header} onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onToggle()}>
      <div className={styles.avatar}>{initials(group.sender)}</div>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{group.sender}</span>
          {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
          <span className={styles.count}>{group.emails.length}</span>
        </div>
        <span className={styles.email}>{group.senderEmail}</span>
      </div>
      <div className={styles.right}>
        <span className={styles.date}>{formatDate(group.latestDate)}</span>
        <span className={styles.chevron}>{expanded ? "▾" : "›"}</span>
      </div>
    </div>
  );
}
