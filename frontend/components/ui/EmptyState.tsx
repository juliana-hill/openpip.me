import styles from "./EmptyState.module.css";
type Props = { icon?: string; title: string; subtitle?: string; action?: React.ReactNode };
export function EmptyState({ icon = "✦", title, subtitle, action }: Props) {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}>{icon}</span>
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {action}
    </div>
  );
}
