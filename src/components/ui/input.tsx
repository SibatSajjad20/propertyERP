import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-8 w-full rounded-sm border border-line bg-surface px-2.5 text-[13px] text-ink",
          "placeholder:text-ink-muted",
          "transition-[border-color] duration-[var(--duration)] ease-[var(--ease-ledger)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
