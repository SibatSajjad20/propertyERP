"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";
import { cleanMoneyInput, formatMoneyInput, type FormatMoneyOptions } from "@/lib/money";
import { cn } from "@/lib/cn";

export interface MoneyInputProps
  extends Omit<InputProps, "value" | "onChange">, FormatMoneyOptions {
  value?: string | number | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (cleanValue: string) => void;
}

function countNonCommas(str: string): number {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== ",") count++;
  }
  return count;
}

function getCursorPosForNonCommas(formatted: string, targetCount: number): number {
  if (targetCount <= 0) return 0;
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") {
      count++;
      if (count === targetCount) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      allowNegative = false,
      allowDecimals = true,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const cursorRef = React.useRef<number | null>(null);

    const options: FormatMoneyOptions = React.useMemo(
      () => ({ allowNegative, allowDecimals }),
      [allowNegative, allowDecimals],
    );

    // Initial display value formatted from value
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      formatMoneyInput(value, options),
    );

    // Keep display value in sync when external value prop changes
    const cleanProp = cleanMoneyInput(value, options);
    const cleanCurrent = cleanMoneyInput(displayValue, options);

    React.useEffect(() => {
      if (cleanProp !== cleanCurrent) {
        setDisplayValue(formatMoneyInput(cleanProp, options));
      }
    }, [cleanProp, cleanCurrent, options]);

    // Restore cursor position synchronously after re-render
    React.useLayoutEffect(() => {
      if (cursorRef.current !== null && inputRef.current) {
        const pos = Math.min(cursorRef.current, inputRef.current.value.length);
        inputRef.current.setSelectionRange(pos, pos);
        cursorRef.current = null;
      }
    });

    const setMergedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref],
    );

    const triggerChange = (
      clean: string,
      formatted: string,
      cursorPos: number,
      originalEvent?: React.ChangeEvent<HTMLInputElement>,
    ) => {
      cursorRef.current = cursorPos;
      setDisplayValue(formatted);
      onValueChange?.(clean);

      if (onChange) {
        const syntheticEvent = originalEvent
          ? {
              ...originalEvent,
              target: {
                ...originalEvent.target,
                name: props.name,
                value: clean,
              },
              currentTarget: {
                ...originalEvent.currentTarget,
                name: props.name,
                value: clean,
              },
            }
          : ({
              target: { name: props.name, value: clean },
              currentTarget: { name: props.name, value: clean },
            } as React.ChangeEvent<HTMLInputElement>);

        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const cursor = e.target.selectionStart ?? rawInput.length;
      const nonCommasBeforeCursor = countNonCommas(rawInput.slice(0, cursor));

      const clean = cleanMoneyInput(rawInput, options);
      const formatted = formatMoneyInput(clean, options);

      const newCursor = getCursorPosForNonCommas(formatted, nonCommasBeforeCursor);
      triggerChange(clean, formatted, newCursor, e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (input) {
        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (e.key === "Backspace" && start !== null && start === end && start > 0) {
          // If character immediately before cursor is a comma, skip over and delete the digit before it
          if (input.value[start - 1] === ",") {
            e.preventDefault();
            const before = input.value.slice(0, start - 2);
            const after = input.value.slice(start);
            const nextRaw = before + after;
            const clean = cleanMoneyInput(nextRaw, options);
            const formatted = formatMoneyInput(clean, options);
            const nonCommasBefore = countNonCommas(before);
            const newCursor = getCursorPosForNonCommas(formatted, nonCommasBefore);
            triggerChange(clean, formatted, newCursor);
            return;
          }
        } else if (
          e.key === "Delete" &&
          start !== null &&
          start === end &&
          start < input.value.length
        ) {
          // If character immediately after cursor is a comma, skip over and delete the digit after it
          if (input.value[start] === ",") {
            e.preventDefault();
            const before = input.value.slice(0, start);
            const after = input.value.slice(start + 2);
            const nextRaw = before + after;
            const clean = cleanMoneyInput(nextRaw, options);
            const formatted = formatMoneyInput(clean, options);
            const nonCommasBefore = countNonCommas(before);
            const newCursor = getCursorPosForNonCommas(formatted, nonCommasBefore);
            triggerChange(clean, formatted, newCursor);
            return;
          }
        }
      }

      onKeyDown?.(e);
    };

    return (
      <Input
        ref={setMergedRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn("tabular-nums", className)}
        {...props}
      />
    );
  },
);

MoneyInput.displayName = "MoneyInput";
