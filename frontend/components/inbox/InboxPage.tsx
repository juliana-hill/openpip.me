"use client";
import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { InboxTab } from "./inbox/InboxTab";
import type { Tag, Email } from "./inbox/InboxTab";
import { TagsCard } from "./sidebar/TagsCard";
import { CampaignsCard } from "./sidebar/CampaignsCard";
import { TemplatesCard } from "./sidebar/TemplatesCard";
import { ComposeModal } from "./compose/ComposeModal";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";
import styles from "./InboxPage.module.css";

export function InboxPage({ userName, userImage }: { userName: string; userImage: string }) {
  const searchParams = useSearchParams();
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [composeOpen, setComposeOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTag, setActiveTag] = useState("All");
  const [emails, setEmails] = useState<Email[]>([]);

  const handleUnreadChange = useCallback((n: number) => setUnreadCount(n), []);
  const handleTagsLoaded = useCallback((t: Tag[]) => setTags(t), []);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const email of emails) {
      for (const name of email.tags) {
        map.set(name, (map.get(name) ?? 0) + 1);
      }
    }
    return map;
  }, [emails]);

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Inbox" />

      <main className={styles.layout}>
        <div className={styles.main}>
          <InboxTab
            unreadCount={unreadCount}
            onUnreadChange={handleUnreadChange}
            onCompose={() => setComposeOpen(true)}
            tags={tags}
            activeTag={activeTag}
            onActiveTagChange={setActiveTag}
            onTagsLoaded={handleTagsLoaded}
            onEmailsLoaded={setEmails}
            initialMessageId={searchParams.get("messageId") ?? undefined}
          />
        </div>

        <aside className={styles.sidebar}>
          <TagsCard
            tags={tags}
            tagCounts={tagCounts}
            activeTag={activeTag}
            onTagClick={setActiveTag}
            onTagsChanged={handleTagsLoaded}
          />
          <CampaignsCard />
          <TemplatesCard />
        </aside>
      </main>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
      <FloatingAssistant />
    </div>
  );
}
