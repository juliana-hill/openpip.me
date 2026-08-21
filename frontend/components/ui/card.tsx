import * as React from "react";
import styles from "./Card.module.css";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  accent?: boolean;
  delay?: number;
  size?: "default" | "sm";
};

function Card({ accent, delay, className, style, children, size: _size, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={[styles.card, accent ? styles.accent : "", className].filter(Boolean).join(" ")}
      style={{ animationDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.cardHeader, className].filter(Boolean).join(" ")} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.cardTitle, className].filter(Boolean).join(" ")} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.cardDescription, className].filter(Boolean).join(" ")} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.cardAction, className].filter(Boolean).join(" ")} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.cardContent, className].filter(Boolean).join(" ")} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[styles.cardFooter, className].filter(Boolean).join(" ")} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
