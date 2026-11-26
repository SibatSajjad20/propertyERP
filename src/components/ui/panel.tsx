import * as React from "react";
import { cn } from "@/lib/cn";

export interface PanelProps {
  title?: React.ReactNode;
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  hint,
  actions,
  children,
  className,
  headerClassName,
  bodyClassName,
}: PanelProps) {
  const hasHeader = Boolean(title || actions);

  return (
    <div
      className={cn(
        "min-w-0 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className,
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex min-h-[50px] items-center justify-between gap-3 border-b border-line px-5 py-3",
            headerClassName,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {typeof title === "string" ? (
              <h3 className="truncate text-[13.5px] font-semibold tracking-[-0.008em] text-ink">
                {title}
              </h3>
            ) : (
              title
            )}
            {hint && (
              <span className="truncate text-[12px] font-normal text-muted">{hint}</span>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
