"use client";
import { useState } from "react";
import type { Tag } from "../inbox/InboxTab";
import { TagManagerModal } from "../inbox/TagManagerModal";
import styles from "./SidebarCard.module.css";
import tagStyles from "./TagsCard.module.css";

type Props = {
  tags: Tag[];
  tagCounts: Map<string, number>;
  activeTag: string;
  onTagClick: (tag: string) => void;
  onTagsChanged: (tags: Tag[]) => void;
};

export function TagsCard({ tags, tagCounts, activeTag, onTagClick, onTagsChanged }: Props) {
  const [managing, setManaging] = useState(false);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <h4 className={styles.label}>Tags</h4>
          <button className={tagStyles.manageBtn} onClick={() => setManaging(true)}>Manage</button>
        </div>

        {tags.length === 0 ? (
          <button className={styles.dashedBtn} onClick={() => setManaging(true)}>
            ＋ Create your first tag
          </button>
        ) : (
          <div className={tagStyles.tagList}>
            {tags.map((tag) => (
              <button
                key={tag.id}
                className={`${tagStyles.tagRow} ${activeTag === tag.name ? tagStyles.active : ""}`}
                onClick={() => onTagClick(tag.name)}
              >
                <span className={tagStyles.dot} style={{ background: tag.color }} />
                <span className={tagStyles.tagName}>{tag.name}</span>
                {tagCounts.has(tag.name) && (
                  <span className={tagStyles.count}>{tagCounts.get(tag.name)}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {managing && (
        <TagManagerModal
          tags={tags}
          onClose={(updated) => { setManaging(false); onTagsChanged(updated); }}
        />
      )}
    </>
  );
}
