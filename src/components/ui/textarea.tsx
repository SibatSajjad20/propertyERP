import * as React from "react";
import { cn } from "@/lib/cn";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[8px] border border-border bg-surface p-3 text-[13px] text-ink transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] placeholder:text-subtle hover:border-line-strong focus:border-primary focus:shadow-[0_0_0_3px_rgba(11,85,139,0.12)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
