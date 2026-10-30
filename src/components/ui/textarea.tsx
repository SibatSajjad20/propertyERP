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
        "w-full rounded-[6px] border border-line bg-surface p-2.5 text-[13px] text-ink transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] placeholder:text-ink-faint hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
