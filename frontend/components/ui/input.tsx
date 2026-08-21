import * as React from "react";
import inputStyles from "./Input.module.css";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={[inputStyles.input, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export { Input };
