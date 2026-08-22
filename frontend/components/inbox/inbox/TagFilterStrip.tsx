import { useState } from "react";
import type { Tag, Email } from "./InboxTab";
import { TagManagerModal } from "./TagManagerModal";
import styles from "./TagFilterStrip.module.css";

type Props = {
  tags: Map<string, number>;
  tagObjects: Tag[];
  active: string;
  onChange: (tag: string) => void;
  archivedCount?: number;
  onManageTags: () => void;
  selectedEmails?: Email[];
  onArchive?: () => void;
  onDelete?: () => void;
  onBlockSender?: (messageIds: string[], senderEmails: string[]) => void;
};

export function TagFilterStrip({ tags, tagObjects, active, onChange, archivedCount = 0, onManageTags, selectedEmails = [], onArchive, onDelete, onBlockSender }: Props) {
  const [managing, setManaging] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const colorMap = new Map(tagObjects.map((t) => [t.name, t.color]));
  const allTags = ["All", ...Array.from(tags.keys()), tags.size > 0 ? "Untagged" : null, "Archived"].filter(Boolean) as string[];

  const uniqueSenders = Array.from(new Set(selectedEmails.map((e) => e.fromEmail).filter(Boolean)));

  const handleConfirmBlock = () => {
    setConfirmingBlock(false);
    onBlockSender?.(
      selectedEmails.map((e) => e.id),
      uniqueSenders,
    );
  };

  return (
    <>
      <div className={styles.strip}>
        {allTags.map((tag) => {
          const color = colorMap.get(tag);
          return (
            <button
              key={tag}
              className={`${styles.pill} ${active === tag ? styles.active : ""}`}
              onClick={() => onChange(tag)}
            >
              {color && (
                <span className={styles.dot} style={{ background: color }} />
              )}
              {tag}
              {tag === "Archived" && archivedCount > 0 && (
                <span className={styles.count}>{archivedCount}</span>
              )}
              {tag !== "All" && tag !== "Untagged" && tag !== "Archived" && tags.has(tag) && (
                <span className={styles.count}>{tags.get(tag)}</span>
              )}
            </button>
          );
        })}

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
