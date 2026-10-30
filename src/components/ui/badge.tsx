"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[11px] font-medium tracking-wide select-none",
  {
    variants: {
      tone: {
        available:
          "border-[color-mix(in_srgb,var(--available)_25%,transparent)] bg-[color-mix(in_srgb,var(--available)_6%,transparent)] text-available",
        sold: "border-[color-mix(in_srgb,var(--sold)_25%,transparent)] bg-[color-mix(in_srgb,var(--sold)_6%,transparent)] text-sold",
        muted: "border-line bg-subtle text-ink-muted",
        accent:
          "border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-accent",
        primary:
          "border-[color-mix(in_srgb,var(--primary)_25%,transparent)] bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] text-primary",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

const dotColors: Record<string, string> = {
  available: "bg-available",
  sold: "bg-sold",
  muted: "bg-ink-muted",
  accent: "bg-accent",
  primary: "bg-primary",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

export function Badge({
  className,
  tone = "muted",
  showDot = true,
  children,
  ...props
}: BadgeProps) {
  const dotColor = dotColors[tone ?? "muted"] ?? "bg-ink-muted";
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {showDot && (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
