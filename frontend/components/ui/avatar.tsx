"use client";

import * as React from "react";

const avatarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  overflow: "hidden",
  flexShrink: 0,
  width: 32,
  height: 32,
  position: "relative",
};

function Avatar({ className, style, children, ...props }: React.ComponentProps<"div"> & { size?: "default" | "sm" | "lg" }) {
  return (
    <div style={{ ...avatarStyle, ...style }} className={className} {...props}>
      {children}
    </div>
  );
}

function AvatarImage({ className, style, ...props }: React.ComponentProps<"img">) {
  return (
    <img
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", ...style }}
      className={className}
      {...props}
    />
  );
}

function AvatarFallback({ className, style, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", height: "100%", borderRadius: "50%",
        background: "var(--color-accent-light)", color: "var(--color-accent)",
        fontSize: "var(--font-size-xs)", fontWeight: 700,
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={className} {...props} />;
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge };
