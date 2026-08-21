import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import styles from "./DashboardNavCard.module.css";

type Props = Readonly<{ href: string; title: string; description: string; metric: string; icon: LucideIcon; accent?: boolean }>;

export function DashboardNavCard({ href, title, description, metric, icon: Icon, accent = false }: Props) {
  return <Link href={href} className={`${styles.card} ${accent ? styles.accent : ""}`}>
    <div className={styles.header}><span className={styles.icon}><Icon size={18} /></span><span className={styles.arrow}>→</span></div>
    <p className={styles.title}>{title}</p><p className={styles.metric}>{metric}</p><p className={styles.description}>{description}</p>
  </Link>;
}
