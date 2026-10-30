"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start justify-center px-4 py-10", className)}>
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
