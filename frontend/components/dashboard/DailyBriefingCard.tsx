import { Sparkles } from "lucide-react";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import styles from "./DailyBriefingCard.module.css";

type Props = Readonly<{ briefing?: string; generatedAt?: string }>;

export function DailyBriefingCard({ briefing = "Your agent will summarize the work that changed overnight here.", generatedAt }: Props) {
  return (
    <section className={styles.card} aria-labelledby="briefing-title">
      <div className={styles.accentBar} />
      <div className={styles.header}>
        <div className={styles.icon} aria-hidden="true"><Sparkles size={20} /></div>
        <div><h2 id="briefing-title" className={styles.title}>Daily Briefing</h2><p className={styles.subtitle}>{generatedAt ?? "Ready when your workspace is connected"}</p></div>
        <ReadAloudButton text={briefing} />
      </div>
      <p className={styles.body}>{briefing}</p>
    </section>
  );
}
