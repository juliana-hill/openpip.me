"use client";

import * as React from "react";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLHRElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <hr
      className={className}
      style={{
        border: "none",
        borderTop: orientation === "horizontal" ? "1px solid var(--color-border)" : undefined,
        borderLeft: orientation === "vertical" ? "1px solid var(--color-border)" : undefined,
        margin: 0,
        ...(props.style ?? {}),
      }}
      {...props}
    />
  );
}

export { Separator };
