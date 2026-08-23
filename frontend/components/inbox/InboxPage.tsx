"use client";
import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { InboxTab } from "./inbox/InboxTab";
import type { Tag } from "./inbox/InboxTab";
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
  const [activeTag, setActiveTag] = useState("Unread");

  const handleUnreadChange = useCallback((n: number) => setUnreadCount(n), []);
  const handleTagsLoaded = useCallback((t: Tag[]) => setTags(t), []);

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
            initialMessageId={searchParams.get("messageId") ?? undefined}
          />
        </div>

        <aside className={styles.sidebar}>
          <CampaignsCard />
          <TemplatesCard />
        </aside>
      </main>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
      <FloatingAssistant />
    </div>
  );
}
