"use client";

import * as React from "react";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  X,
} from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/cn";

export interface DatePickerProps {
  value?: string | null;
  onChange?: (date: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  name?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseIsoDate(
  val?: string | null,
): { year: number; month: number; day: number } | null {
  if (!val || typeof val !== "string") return null;
  const parts = val.trim().split("-");
  if (parts.length < 3) return null;
  const y = Number.parseInt(parts[0] || "", 10);
  const m = Number.parseInt(parts[1] || "", 10) - 1;
  const d = Number.parseInt(parts[2] || "", 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return { year: y, month: m, day: d };
}

function formatIso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatDisplayDate(val?: string | null): string {
  const parsed = parseIsoDate(val);
  if (!parsed) return "";
  const d = new Date(parsed.year, parsed.month, parsed.day);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
  disabled = false,
  allowClear = false,
  className,
  triggerClassName,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsedVal = React.useMemo(() => parseIsoDate(value), [value]);

  const today = React.useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
  }, []);

  // View navigation override state
  const [navOffset, setNavOffset] = React.useState<{
    year: number;
    month: number;
  } | null>(null);

  const baseYear = parsedVal?.year ?? today.year;
  const baseMonth = parsedVal?.month ?? today.month;

  const viewYear = navOffset?.year ?? baseYear;
  const viewMonth = navOffset?.month ?? baseMonth;

  const isDateDisabled = React.useCallback(
    (y: number, m: number, d: number): boolean => {
      const iso = formatIso(y, m, d);
      if (min && iso < min) return true;
      if (max && iso > max) return true;
      return false;
    },
    [min, max],
  );

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setNavOffset({ year: viewYear - 1, month: 11 });
    } else {
      setNavOffset({ year: viewYear, month: viewMonth - 1 });
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setNavOffset({ year: viewYear + 1, month: 0 });
    } else {
      setNavOffset({ year: viewYear, month: viewMonth + 1 });
    }
  }

  function handlePrevYear() {
    setNavOffset({ year: viewYear - 1, month: viewMonth });
  }

  function handleNextYear() {
    setNavOffset({ year: viewYear + 1, month: viewMonth });
  }

  function handleSelectDate(day: number, month = viewMonth, year = viewYear) {
    if (isDateDisabled(year, month, day)) return;
    const iso = formatIso(year, month, day);
    onChange?.(iso);
    setNavOffset(null);
    setOpen(false);
  }

  function handleSelectToday() {
    handleSelectDate(today.day, today.month, today.year);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.("");
  }

  // Days in month calculation
  const calendarDays = React.useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    // In JS Sunday is 0, so convert Monday to 0
    const startOffset = (firstDayOfWeek + 6) % 7;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      iso: string;
      disabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Previous month filler days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = formatIso(y, m, d);
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        iso,
        disabled: isDateDisabled(y, m, d),
        isSelected: Boolean(
          parsedVal &&
          parsedVal.year === y &&
          parsedVal.month === m &&
          parsedVal.day === d,
        ),
        isToday: today.year === y && today.month === m && today.day === d,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const iso = formatIso(viewYear, viewMonth, d);
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        iso,
        disabled: isDateDisabled(viewYear, viewMonth, d),
        isSelected: Boolean(
          parsedVal &&
          parsedVal.year === viewYear &&
          parsedVal.month === viewMonth &&
          parsedVal.day === d,
        ),
        isToday: today.year === viewYear && today.month === viewMonth && today.day === d,
      });
    }

    // Next month filler days to complete standard 42 days (6 weeks) grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = formatIso(y, m, d);
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        iso,
        disabled: isDateDisabled(y, m, d),
        isSelected: Boolean(
          parsedVal &&
          parsedVal.year === y &&
          parsedVal.month === m &&
          parsedVal.day === d,
        ),
        isToday: today.year === y && today.month === m && today.day === d,
      });
    }

    return days;
  }, [viewYear, viewMonth, parsedVal, today, isDateDisabled]);

  return (
    <div className={cn("relative inline-block w-full", className)}>
      {name && <input type="hidden" name={name} value={value || ""} />}
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setNavOffset(null);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-9 w-full cursor-pointer items-center justify-between rounded-[8px] border border-line bg-surface px-3 py-1.5 text-left font-sans text-[13px] text-ink shadow-xs transition-colors",
              "hover:border-line-hover focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none",
              disabled && "cursor-not-allowed bg-subtle/50 opacity-60",
              !value && "text-ink-muted",
              triggerClassName,
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarBlank weight="light" className="size-4 shrink-0 text-ink-muted" />
              <span className="truncate">
                {value ? formatDisplayDate(value) : placeholder}
              </span>
            </div>

            {allowClear && value && !disabled ? (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="rounded-full p-0.5 text-ink-muted hover:bg-subtle hover:text-ink"
                title="Clear date"
              >
                <X weight="bold" className="size-3" />
              </span>
            ) : null}
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[280px] p-3 text-ink shadow-floating">
          {/* Calendar Header Navigation */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevYear}
                className="flex size-7 items-center justify-center rounded-[6px] text-ink-muted hover:bg-subtle hover:text-ink"
                title="Previous year"
              >
                <CaretDoubleLeft weight="bold" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex size-7 items-center justify-center rounded-[6px] text-ink-muted hover:bg-subtle hover:text-ink"
                title="Previous month"
              >
                <CaretLeft weight="bold" className="size-3.5" />
              </button>
            </div>

            <div className="font-sans text-[13px] font-semibold text-ink select-none">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNextMonth}
                className="flex size-7 items-center justify-center rounded-[6px] text-ink-muted hover:bg-subtle hover:text-ink"
                title="Next month"
              >
                <CaretRight weight="bold" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                className="flex size-7 items-center justify-center rounded-[6px] text-ink-muted hover:bg-subtle hover:text-ink"
                title="Next year"
              >
                <CaretDoubleRight weight="bold" className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center font-sans text-[11px] font-medium text-ink-muted select-none">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-sans text-[12px]">
            {calendarDays.map((d, idx) => {
              return (
                <button
                  key={`${d.iso}-${idx}`}
                  type="button"
                  disabled={d.disabled}
                  onClick={() => handleSelectDate(d.day, d.month, d.year)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[6px] font-medium transition-colors select-none",
                    d.disabled && "cursor-not-allowed opacity-25",
                    !d.disabled &&
                      !d.isSelected &&
                      d.isCurrentMonth &&
                      "text-ink hover:bg-subtle",
                    !d.disabled &&
                      !d.isSelected &&
                      !d.isCurrentMonth &&
                      "text-ink-muted/50 hover:bg-subtle/60",
                    d.isToday &&
                      !d.isSelected &&
                      "border border-primary font-semibold text-primary",
                    d.isSelected &&
                      "bg-primary font-semibold text-white shadow-xs hover:bg-primary-hover",
                  )}
                >
                  {d.day}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 text-[11.5px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-medium text-primary hover:underline"
            >
              Today
            </button>
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
                className="text-ink-muted hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
