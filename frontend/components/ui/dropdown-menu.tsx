"use client";

import * as React from "react";

type DropdownContextType = { open: boolean; setOpen: (v: boolean) => void };
const DropdownContext = React.createContext<DropdownContextType>({ open: false, setOpen: () => {} });

function DropdownMenu({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} style={{ position: "relative", display: "inline-block" }}>{children}</div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuTrigger({ children, asChild, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen, open } = React.useContext(DropdownContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => { (children.props as Record<string, unknown> & { onClick?: (e: React.MouseEvent) => void }).onClick?.(e); setOpen(!open); },
    });
  }
  return <button type="button" onClick={() => setOpen(!open)} {...props}>{children}</button>;
}

function DropdownMenuContent({ className, align: _align, alignOffset: _alignOffset, side, sideOffset: _sideOffset, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: string; alignOffset?: number; side?: string; sideOffset?: number }) {
  const { open } = React.useContext(DropdownContext);
  if (!open) return null;
  const isTop = side === "top";
  return (
    <div
      style={{
        position: "absolute",
        ...(isTop ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
        left: 0,
        zIndex: 60,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuLabel({ className, inset: _inset, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      style={{ padding: "4px 8px", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ className, inset: _inset, variant: _variant, children, onClick, ...props }: React.HTMLAttributes<HTMLButtonElement> & { inset?: boolean; variant?: string }) {
  const { setOpen } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={(e) => { onClick?.(e); setOpen(false); }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSub({ children }: { children?: React.ReactNode }) { return <>{children}</>; }
function DropdownMenuSubTrigger({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { inset?: boolean }) { return <button type="button" {...props}>{children}</button>; }
function DropdownMenuSubContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: string; alignOffset?: number; side?: string; sideOffset?: number }) { return <div {...props}>{children}</div>; }
function DropdownMenuCheckboxItem({ children, checked: _checked, inset: _inset, ...props }: React.HTMLAttributes<HTMLButtonElement> & { inset?: boolean; checked?: boolean }) { return <button type="button" {...props}>{children}</button>; }
function DropdownMenuRadioGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props}>{children}</div>; }
function DropdownMenuRadioItem({ children, inset: _inset, ...props }: React.HTMLAttributes<HTMLButtonElement> & { inset?: boolean }) { return <button type="button" {...props}>{children}</button>; }
function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "4px 0" }} className={className} {...props} />;
}
function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }} className={className} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
