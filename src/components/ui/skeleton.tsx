import * as React from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "button" | "input" | "card" | "circle";
}

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  const variantStyles = {
    text: "h-4 rounded",
    button: "h-[34px] rounded-[8px]",
    input: "h-[38px] rounded-[8px]",
    card: "h-[120px] rounded-[12px]",
    circle: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse rounded-[6px] bg-slate-200/90",
        variant && variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
