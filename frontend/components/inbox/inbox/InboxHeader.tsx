import styles from "./InboxHeader.module.css";

export function InboxHeader({ unreadCount, onCompose }: { unreadCount: number; onCompose: () => void }) {
  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <h2 className={styles.title}>Inbox</h2>
        {unreadCount > 0 && (
          <span className={styles.unreadPill}>{unreadCount} UNREAD</span>
        )}
      </div>
      <button className={styles.composeBtn} onClick={onCompose}>
        Compose
      </button>
    </div>
  );
}
