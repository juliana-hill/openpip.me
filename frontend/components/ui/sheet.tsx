"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import sheetStyles from "./Sheet.module.css";

type SheetContextType = { open: boolean; onOpenChange: (open: boolean) => void };
const SheetContext = React.createContext<SheetContextType>({ open: false, onOpenChange: () => {} });

function Sheet({ open = false, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange: onOpenChange ?? (() => {}) }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = React.useContext(SheetContext);
  return <button type="button" onClick={() => onOpenChange(true)} {...props}>{children}</button>;
}

function SheetClose({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = React.useContext(SheetContext);
  return <button type="button" onClick={() => onOpenChange(false)} {...props}>{children}</button>;
}

function SheetPortal({ children }: { children?: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<>{children}</>, document.body);
}

function SheetOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onOpenChange } = React.useContext(SheetContext);
  return (
    <div
      className={[sheetStyles.overlay, className].filter(Boolean).join(" ")}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "right" | "bottom" | "left"; showCloseButton?: boolean }) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;
  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        className={[sheetStyles.panel, sheetStyles[side], className].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {showCloseButton && (
          <button type="button" aria-label="Close" className={sheetStyles.closeBtn} onClick={() => onOpenChange(false)}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
        {children}
      </div>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[sheetStyles.header, className].filter(Boolean).join(" ")} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[sheetStyles.footer, className].filter(Boolean).join(" ")} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={[sheetStyles.title, className].filter(Boolean).join(" ")} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={[sheetStyles.description, className].filter(Boolean).join(" ")} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
