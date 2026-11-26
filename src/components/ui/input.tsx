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
            "flex w-full items-center overflow-hidden rounded-[8px] border border-border bg-surface transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(11,85,139,0.12)]",
            sizeVariant === "sm" ? "h-[32px] text-[12.5px]" : "h-[38px] text-[13px]",
            className,
          )}
        >
          {prefixText && (
            <span className="flex h-full shrink-0 items-center border-r border-border bg-sidebar-bg px-3 text-[12.5px] font-medium text-muted select-none">
              {prefixText}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13px] text-ink outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />
          {suffixText && (
            <span className="flex h-full shrink-0 items-center border-l border-border bg-sidebar-bg px-3 text-[12.5px] font-medium text-muted select-none">
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
          "w-full rounded-[8px] border border-border bg-surface text-ink transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] placeholder:text-subtle hover:border-line-strong focus:border-primary focus:shadow-[0_0_0_3px_rgba(11,85,139,0.12)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          sizeVariant === "sm"
            ? "h-[32px] px-2.5 text-[12.5px]"
            : "h-[38px] px-3 text-[13px]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
