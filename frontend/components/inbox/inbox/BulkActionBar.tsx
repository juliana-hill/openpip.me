import { useState } from "react";
import styles from "./BulkActionBar.module.css";
import type { Email } from "./InboxTab";

type Props = {
  count: number;
  selectedEmails: Email[];
  onArchive: () => void;
  onDelete: () => void;
  onBlockSender: (messageIds: string[], senderEmails: string[]) => void;
  onClear: () => void;
};

export function BulkActionBar({ count, selectedEmails, onArchive, onDelete, onBlockSender, onClear }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (count === 0) return null;

  const uniqueSenders = Array.from(new Set(selectedEmails.map((e) => e.fromEmail).filter(Boolean)));

  const handleBlockClick = () => setConfirming(true);

  const handleConfirmBlock = () => {
    setConfirming(false);
    onBlockSender(
      selectedEmails.map((e) => e.id),
      uniqueSenders,
    );
  };

  if (confirming) {
    return (
      <div className={styles.bar}>
        <span className={styles.count}>
          Block {uniqueSenders.length === 1 ? uniqueSenders[0] : `${uniqueSenders.length} senders`}?
        </span>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={handleConfirmBlock}>✓ Confirm</button>
          <button className={`${styles.btn} ${styles.clear}`} onClick={() => setConfirming(false)}>✕ Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bar}>
      <span className={styles.count}>{count} selected</span>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={onArchive}>📦 Archive</button>
        <button className={styles.btn} onClick={onDelete}>🗑 Delete</button>
        <button className={styles.btn} onClick={handleBlockClick}>🚫 Block sender</button>
        <button className={`${styles.btn} ${styles.clear}`} onClick={onClear}>✕ Clear</button>
      </div>
    </div>
  );
}
