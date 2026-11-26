import * as React from "react";
import { cn } from "@/lib/cn";

export interface DefinitionListItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface DefinitionListProps {
  items?: DefinitionListItem[];
  children?: React.ReactNode;
  className?: string;
}

export function DefinitionList({ items, children, className }: DefinitionListProps) {
  return (
    <dl className={cn("grid grid-cols-[140px_1fr] text-[13px]", className)}>
      {items
        ? items.map((item, i) => (
            <React.Fragment key={i}>
              <dt className="border-t border-[#F2F4F6] py-2 text-muted first:border-t-0">
                {item.label}
              </dt>
              <dd className="border-t border-[#F2F4F6] py-2 text-right font-medium break-words text-ink first:border-t-0">
                {item.value}
              </dd>
            </React.Fragment>
          ))
        : children}
    </dl>
  );
}

export function DefinitionRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <dt
        className={cn(
          "border-t border-[#F2F4F6] py-2 text-muted first:border-t-0",
          className,
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "border-t border-[#F2F4F6] py-2 text-right font-medium break-words text-ink first:border-t-0",
          className,
        )}
      >
        {value}
      </dd>
    </>
  );
}
