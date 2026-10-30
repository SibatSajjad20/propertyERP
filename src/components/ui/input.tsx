import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.ComponentProps<"input"> {
  sizeVariant?: "sm" | "md";
  prefixText?: string;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", sizeVariant = "md", prefixText, suffixText, ...props },
    ref,
  ) => {
    if (prefixText || suffixText) {
      return (
        <div
          className={cn(
            "flex w-full items-center rounded-[6px] border border-line bg-surface transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] focus-within:border-line-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)]",
            sizeVariant === "sm" ? "h-7 text-[12px]" : "h-8 text-[13px]",
            className,
          )}
        >
          {prefixText && (
            <span className="shrink-0 px-2.5 text-[12px] font-medium text-ink-muted select-none">
              {prefixText}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />
          {suffixText && (
            <span className="shrink-0 px-2.5 text-[12px] font-medium text-ink-muted select-none">
              {suffixText}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-[6px] border border-line bg-surface text-ink transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] placeholder:text-ink-faint hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
          sizeVariant === "sm" ? "h-7 px-2 text-[12px]" : "h-8 px-2.5 text-[13px]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
