"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, X } from "lucide-react";
import { TrippyIcon } from "@/components/TrippyIcon";
import { idbReadChatSession, type ChatSession, type ChatMessage } from "@/lib/idb";
import dialogStyles from "@/components/ui/Dialog.module.css";
import styles from "./CareerChatSessionModal.module.css";

type Props = Readonly<{
  session: ChatSession | null;
  onClose: () => void;
}>;

export function CareerChatSessionModal({ session, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!session) { setMessages([]); return; }
    idbReadChatSession(session.id).then((data) => {
      setMessages(data?.messages ?? []);
    }).catch(() => {});
  }, [session?.id]);

  if (!session) return null;

  const pairs: Array<{ user: ChatMessage; assistant?: ChatMessage }> = [];
  for (let i = 0; i < messages.length; i += 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    if (user) pairs.push({ user, assistant });
  }

  return (
    <>
      <div className={dialogStyles.overlay} onClick={onClose} />
      <div className={dialogStyles.content}>
        <div className={dialogStyles.header}>
          <h2 className={dialogStyles.title}>
            {new Date(session.createdAt).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h2>
        </div>
        <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close">
          <X style={{ width: 16, height: 16 }} />
        </button>

        <div className={styles.body}>
          {pairs.map(({ user, assistant }, i) => (
            <div key={i} className={styles.turn}>
              <div className={styles.msgRow}>
                <div className={styles.avatar}><User style={{ width: 14, height: 14 }} /></div>
                <p className={styles.userMsg}>{user.message}</p>
              </div>
              {assistant && (
                <div className={styles.msgRow}>
                  <TrippyIcon sizeClass="h-10 w-10" />
                  <div className={styles.assistantContent}>
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p>{children}</p>,
                        ul: ({ children }) => <ul>{children}</ul>,
                        ol: ({ children }) => <ol>{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong>{children}</strong>,
                        code: ({ children }) => <code>{children}</code>,
                      }}
                    >
                      {assistant.message}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
