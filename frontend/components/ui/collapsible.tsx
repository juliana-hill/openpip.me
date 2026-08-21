"use client";

import * as React from "react";

type CollapsibleContextType = { open: boolean; setOpen: (v: boolean) => void };
const CollapsibleContext = React.createContext<CollapsibleContextType>({ open: false, setOpen: () => {} });

function Collapsible({ defaultOpen = false, open: controlledOpen, onOpenChange, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => { if (!isControlled) setInternalOpen(v); onOpenChange?.(v); };
  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div {...props}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

function CollapsibleTrigger({ children, onClick, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen } = React.useContext(CollapsibleContext);
  return (
    <button
      type="button"
      aria-expanded={open}
      data-panel-open={open ? "" : undefined}
      onClick={(e) => { setOpen(!open); (onClick as React.MouseEventHandler<HTMLButtonElement>)?.(e); }}
      {...props}
    >
      {children}
    </button>
  );
}

function CollapsibleContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = React.useContext(CollapsibleContext);
  if (!open) return null;
  return <div data-panel-open="" {...props}>{children}</div>;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
