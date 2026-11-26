import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 border-t border-line py-[22px] first:border-t-0 md:grid-cols-[280px_1fr] md:gap-10",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-[13.5px] leading-tight font-semibold text-ink">{title}</h3>
        {description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
