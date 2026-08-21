"use client";

import * as React from "react";

// Minimal no-op tooltip — the design system doesn't use tooltips actively
function TooltipProvider({ children }: { children?: React.ReactNode; delay?: number }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function TooltipTrigger({ children, asChild, ...props }: React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean }) {
  return <span {...props}>{children}</span>;
}

function TooltipContent({ children, className, side: _side, sideOffset: _sideOffset, align: _align, alignOffset: _alignOffset, ...props }: React.HTMLAttributes<HTMLDivElement> & { side?: string; sideOffset?: number; align?: string; alignOffset?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        background: "var(--color-text)",
        color: "var(--color-bg)",
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: "var(--font-size-xs)",
        whiteSpace: "nowrap",
        zIndex: 100,
        pointerEvents: "none",
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
