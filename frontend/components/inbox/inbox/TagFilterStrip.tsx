import { useState } from "react";
import type { Tag, Email } from "./InboxTab";
import { TagManagerModal } from "./TagManagerModal";
import styles from "./TagFilterStrip.module.css";

type Props = {
  tags: Map<string, number>;
  tagObjects: Tag[];
  active: string;
  onChange: (tag: string) => void;
  onManageTags: () => void;
  selectedEmails?: Email[];
  onArchive?: () => void;
  onDelete?: () => void;
  onBlockSender?: (messageIds: string[], senderEmails: string[]) => void;
};

export function TagFilterStrip({ tags, tagObjects, active, onChange, onManageTags, selectedEmails = [], onArchive, onDelete, onBlockSender }: Props) {
  const [managing, setManaging] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const colorMap = new Map(tagObjects.map((t) => [t.name, t.color]));
  // Mailbox states stay anchored. User Gmail labels are the part of the
  // control that may scroll, and are still the only things Tags manages.
  const staticFilters = ["Unread", "Drafts"];
  const userLabels = Array.from(tags.keys()).filter((tag) => !staticFilters.includes(tag));
  const allTags = [...staticFilters, ...userLabels, tags.size > 0 ? "Untagged" : null].filter(Boolean) as string[];

  const uniqueSenders = Array.from(new Set(selectedEmails.map((e) => e.fromEmail).filter(Boolean)));

  const handleConfirmBlock = () => {
    setConfirmingBlock(false);
    onBlockSender?.(
      selectedEmails.map((e) => e.id),
      uniqueSenders,
    );
  };

  const renderTagPill = (tag: string) => {
    const color = colorMap.get(tag);
    return (
      <button
        key={tag}
        className={`${styles.pill} ${active === tag ? styles.active : ""}`}
        onClick={() => onChange(tag)}
      >
        {color && <span className={styles.dot} style={{ background: color }} />}
        {tag}
      </button>
    );
  };

  return (
    <>
      <div className={styles.strip}>
        {staticFilters.map((tag) => <span key={tag} className={styles.staticPill}>{renderTagPill(tag)}</span>)}

        <div className={styles.scrollArea}>
          {allTags.slice(staticFilters.length).map(renderTagPill)}

          {selectedEmails.length > 0 && (
            <>
              {onArchive && (
                <button className={`${styles.pill} ${styles.actionPill}`} onClick={onArchive}>
                  📦 Archive
                </button>
              )}
              {onDelete && (
                <button className={`${styles.pill} ${styles.dangerPill}`} onClick={onDelete}>
                  🗑 Delete
                </button>
              )}
              {onBlockSender && (
                confirmingBlock ? (
                  <>
                    <button className={`${styles.pill} ${styles.dangerPill}`} onClick={handleConfirmBlock}>
                      ✓ Block {uniqueSenders.length === 1 ? uniqueSenders[0] : `${uniqueSenders.length} senders`}
                    </button>
                    <button className={`${styles.pill} ${styles.actionPill}`} onClick={() => setConfirmingBlock(false)}>
                      ✕ Cancel
                    </button>
                  </>
                ) : (
                  <button className={`${styles.pill} ${styles.dangerPill}`} onClick={() => setConfirmingBlock(true)}>
                    🚫 Block sender
                  </button>
                )
              )}
            </>
          )}
        </div>

        <button
          className={styles.manageBtn}
          onClick={() => setManaging(true)}
          title="Manage tags"
        >
          ＋ Tags
        </button>
      </div>
      {managing && (
        <TagManagerModal
          tags={tagObjects}
          onClose={() => { setManaging(false); onManageTags(); }}
        />
      )}
    </>
  );
}
