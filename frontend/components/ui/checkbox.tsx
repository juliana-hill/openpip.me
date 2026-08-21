"use client";

import * as React from "react";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onCheckedChange?: (checked: boolean) => void;
};

function Checkbox({ className, onCheckedChange, onChange, style, ...props }: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      onChange={handleChange}
      style={{
        width: 16, height: 16,
        borderRadius: 4,
        border: "1px solid var(--color-border)",
        accentColor: "var(--color-accent)",
        cursor: "pointer",
        flexShrink: 0,
        ...style,
      }}
      className={className}
      {...props}
    />
  );
}

export { Checkbox };
