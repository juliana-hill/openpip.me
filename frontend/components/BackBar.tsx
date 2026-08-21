import Link from "next/link";
import styles from "./BackBar.module.css";

export function BackBar({ href = "/", label = "Dashboard" }: { href?: string; label?: string }) {
  return (
    <div className={styles.bar}>
      <Link href={href} className={styles.link}>← {label}</Link>
    </div>
  );
}
