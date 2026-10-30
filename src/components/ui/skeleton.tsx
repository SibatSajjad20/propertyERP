import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[4px] bg-[color-mix(in_srgb,var(--line)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
