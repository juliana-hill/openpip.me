import type { Tag } from "./InboxTab";
import styles from "./TagBadge.module.css";

type Props = {
  tag: Tag;
  onRemove?: () => void;
  size?: "sm" | "md";
};

export function TagBadge({ tag, onRemove, size = "md" }: Props) {
  return (
    <span
      className={`${styles.badge} ${size === "sm" ? styles.sm : styles.md}`}
      style={{
        backgroundColor: tag.color + "20",
        color: tag.color,
        border: `1px solid ${tag.color}40`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          className={styles.remove}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
