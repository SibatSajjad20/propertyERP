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
        "inline-flex items-center gap-[2px] rounded-[8px] bg-[#EEF1F4] p-[2px] select-none",
        className,
      )}
    >
      <TabsPrimitive.List className="inline-flex items-center gap-[2px]">
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-[6px] font-medium whitespace-nowrap transition-all duration-[var(--duration-hover)] ease-[var(--ease-ledger)] disabled:pointer-events-none disabled:opacity-40",
              size === "sm"
                ? "h-[24px] px-2 text-[11.5px]"
                : "h-[28px] px-[11px] text-[12.5px]",
              "text-muted hover:text-ink data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-[0_1px_2px_rgba(15,23,42,0.08)]",
            )}
          >
            {option.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
