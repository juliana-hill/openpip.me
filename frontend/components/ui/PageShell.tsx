import styles from "./PageShell.module.css";

type Props = {
  children: React.ReactNode;
};

export function PageShell({ children }: Props) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
