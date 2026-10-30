import * as React from "react";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/cn";

export interface NumberInputProps extends Omit<InputProps, "type"> {
  prefix?: string;
  suffix?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, prefix, suffix, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        prefixText={prefix}
        suffixText={suffix}
        className={cn("text-right font-mono tabular-nums", className)}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";
