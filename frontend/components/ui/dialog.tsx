"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import dialogStyles from "./Dialog.module.css";

type DialogContextType = { open: boolean; onOpenChange: (open: boolean) => void };
const DialogContext = React.createContext<DialogContextType>({ open: false, onOpenChange: () => {} });

function Dialog({ open = false, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange ?? (() => {}) }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, asChild, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => { (children.props as Record<string, unknown> & { onClick?: (e: React.MouseEvent) => void }).onClick?.(e); onOpenChange(true); },
    });
  }
  return <button type="button" onClick={() => onOpenChange(true)} {...props}>{children}</button>;
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<>{children}</>, document.body);
}

function DialogOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <div
      className={[dialogStyles.overlay, className].filter(Boolean).join(" ")}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

function DialogClose({ children, asChild, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => { (children.props as Record<string, unknown> & { onClick?: (e: React.MouseEvent) => void }).onClick?.(e); onOpenChange(false); },
    });
  }
  return <button type="button" onClick={() => onOpenChange(false)} {...props}>{children}</button>;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  const { open, onOpenChange } = React.useContext(DialogContext);
  if (!open) return null;
  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        className={[dialogStyles.content, className].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {showCloseButton && (
          <button
            type="button"
            aria-label="Close"
            className={dialogStyles.closeBtn}
            onClick={() => onOpenChange(false)}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
        {children}
      </div>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={[dialogStyles.header, className].filter(Boolean).join(" ")} {...props} />;
}

function DialogFooter({ className, showCloseButton: _showCloseButton, children, ...props }: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div className={[dialogStyles.footer, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={[dialogStyles.title, className].filter(Boolean).join(" ")} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={[dialogStyles.description, className].filter(Boolean).join(" ")} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
