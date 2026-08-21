import styles from "./Skeleton.module.css";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export { Skeleton };
