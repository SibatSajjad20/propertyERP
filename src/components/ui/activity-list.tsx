import * as React from "react";
import { cn } from "@/lib/cn";

export interface ActivityItem {
  id: string;
  title: React.ReactNode;
  subLine?: React.ReactNode;
  time: React.ReactNode;
  active?: boolean;
}

export interface ActivityListProps {
  items: ActivityItem[];
  className?: string;
  emptyMessage?: string;
}

export function ActivityList({
  items,
  className,
  emptyMessage = "No activity recorded yet.",
}: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-[12.5px] text-muted">{emptyMessage}</div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="relative flex gap-3 py-2.5">
            {!isLast && (
              <span
                className="absolute top-[18px] bottom-[-2px] left-[3px] w-[1px] bg-line"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1.5 size-[7px] shrink-0 rounded-full shadow-[0_0_0_3px_#FFFFFF]",
                item.active ? "bg-primary" : "bg-[#CBD2DA]",
              )}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 text-[13px]">
              <div className="min-w-0 flex-1 leading-snug text-ink">
                <div>{item.title}</div>
                {item.subLine && (
                  <div className="mt-0.5 text-[12px] text-muted">{item.subLine}</div>
                )}
              </div>
              <span className="shrink-0 text-[12px] whitespace-nowrap text-subtle">
                {item.time}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
