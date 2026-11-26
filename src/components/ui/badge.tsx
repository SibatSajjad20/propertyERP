"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 h-[22px] rounded-full px-2.5 text-[12px] font-medium select-none transition-colors duration-[var(--duration-hover)] ease-[var(--ease-ledger)] whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-[#F1F3F6] text-text-secondary",
        blue: "bg-primary-soft text-primary",
        ok: "bg-ok-soft text-ok",
        warn: "bg-[#FEF6EE] text-[#B54708]",
        bad: "bg-bad-soft text-bad",
        dark: "bg-[#F1F3F6] text-text-secondary",
        muted: "bg-[#F1F3F6] text-muted",

        // Backward-compatible aliases
        available: "bg-ok-soft text-ok",
        reserved: "bg-[#FEF6EE] text-[#B54708]",
        booked: "bg-primary-soft text-primary",
        sold: "bg-[#F1F3F6] text-text-secondary",
        primary: "bg-primary-soft text-primary",
        accent: "bg-primary-soft text-primary",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

const dotColors: Record<string, string> = {
  neutral: "bg-[#94A3B8]",
  blue: "bg-primary",
  ok: "bg-ok",
  warn: "bg-warn-dot",
  bad: "bg-bad",
  dark: "bg-[#475569]",
  muted: "bg-[#CBD2DA]",

  available: "bg-ok",
  reserved: "bg-warn-dot",
  booked: "bg-primary",
  sold: "bg-[#475569]",
  primary: "bg-primary",
  accent: "bg-primary",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

export function Badge({
  className,
  tone = "neutral",
  showDot = true,
  children,
  ...props
}: BadgeProps) {
  const dotColor = dotColors[tone ?? "neutral"] ?? "bg-ink-muted";
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full transition-transform duration-200",
            dotColor,
          )}
          aria-hidden="true"
        />
      )}
      <span className="transition-opacity duration-150">{children}</span>
    </span>
  );
}

export const Pill = Badge;

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "AVAILABLE" | "RESERVED" | "BOOKED" | "SOLD" | "PENDING" | string;
  dotColor?: string;
  textColor?: string;
  children?: React.ReactNode;
}

const statusDotMap: Record<string, { dot: string; text?: string; defaultLabel: string }> =
  {
    AVAILABLE: { dot: "bg-ok", text: "text-ink2", defaultLabel: "Available" },
    RESERVED: { dot: "bg-warn-dot", text: "text-ink2", defaultLabel: "Reserved" },
    BOOKED: { dot: "bg-primary", text: "text-ink2", defaultLabel: "Booked" },
    SOLD: { dot: "bg-[#475569]", text: "text-ink2", defaultLabel: "Sold" },
    PENDING: { dot: "bg-[#CBD2DA]", text: "text-muted", defaultLabel: "Pending" },
    UPCOMING: { dot: "bg-[#CBD2DA]", text: "text-muted", defaultLabel: "Upcoming" },
  };

export function StatusDot({
  status,
  dotColor,
  textColor,
  children,
  className,
  ...props
}: StatusDotProps) {
  const meta = statusDotMap[status.toUpperCase()] ?? {
    dot: "bg-line-strong",
    text: "text-muted",
    defaultLabel: status,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] text-[12.5px] font-normal whitespace-nowrap",
        textColor || meta.text || "text-ink2",
        className,
      )}
      {...props}
    >
      <span
        className={cn("size-[7px] shrink-0 rounded-full", dotColor || meta.dot)}
        aria-hidden="true"
      />
      <span>{children ?? meta.defaultLabel}</span>
    </span>
  );
}
