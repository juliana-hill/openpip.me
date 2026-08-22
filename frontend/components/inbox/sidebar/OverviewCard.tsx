import styles from "./SidebarCard.module.css";

type Props = {
  unreadCount: number;
  gmailCount: number;
};

export function OverviewCard({ unreadCount, gmailCount }: Props) {
  return (
    <div className={styles.card}>
      <h4 className={styles.label}>Overview</h4>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>Total Unread</span>
        <span className={styles.bigNumber}>{unreadCount}</span>
      </div>
      <div className={styles.grid2}>
        <div className={styles.miniStat}>
          <span className={styles.miniLabel}>Gmail</span>
          <span className={styles.miniNumber} style={{ color: "#45dfa4" }}>{gmailCount}</span>
        </div>
      </div>
    </div>
  );
}
