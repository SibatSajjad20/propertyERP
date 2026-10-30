"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={(val) => onValueChange(val as T)}
      className={cn(
        "inline-flex items-center rounded-[6px] border border-line bg-subtle p-0.5 select-none",
        className,
      )}
    >
      <TabsPrimitive.List className="inline-flex items-center gap-0.5">
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-[4px] font-medium transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] disabled:pointer-events-none disabled:opacity-40",
              size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-[12px]",
              "text-ink-muted hover:text-ink data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-[0_1px_2px_rgba(26,26,23,0.04)]",
            )}
          >
            {option.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
