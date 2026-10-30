"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CaretDown, Check, X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface FilterChipOption {
  id: string;
  name: string;
}

export interface FilterChipProps {
  label: string;
  value: string;
  options: FilterChipOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterChip({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
}: FilterChipProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((opt) => opt.id === value);
  const isActive = Boolean(value && value !== "" && value !== "all");

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[6px] border px-2.5 text-[12px] font-medium transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] outline-none select-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]",
            isActive
              ? "border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-primary"
              : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
          )}
        >
          <span>{label}</span>
          {isActive ? (
            <>
              <span className="font-normal text-ink-muted">:</span>
              <span className="max-w-[120px] truncate font-semibold text-primary">
                {selectedOption?.name ?? value}
              </span>
            </>
          ) : null}
          <CaretDown weight="light" className="ml-0.5 size-3 opacity-60" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="shadow-floating animate-slide-down z-50 w-48 rounded-[8px] border border-line bg-surface p-1 text-ink outline-none"
        >
          <div className="px-2 py-1 text-[11px] font-medium tracking-wide text-ink-muted">
            {label}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const selected = option.id === value || (!value && option.id === "");
              return (
                <button
                  key={option.id || "empty"}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-[4px] px-2 py-1.5 text-left text-[13px] transition-colors outline-none select-none hover:bg-subtle focus:bg-subtle",
                    selected ? "bg-subtle/60 font-medium text-ink" : "text-ink-muted",
                  )}
                >
                  <span className="truncate">{option.name || placeholder}</span>
                  {selected && <Check weight="light" className="size-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export interface FilterBarProps {
  activeCount?: number;
  onClearAll?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({
  activeCount = 0,
  onClearAll,
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {activeCount > 0 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-[12px] text-ink-muted hover:text-ink"
        >
          <X weight="light" className="mr-1 size-3" />
          Clear all ({activeCount})
        </Button>
      )}
    </div>
  );
}
