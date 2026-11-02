"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "./animated-number";

export interface StatCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  caption?: React.ReactNode;
  captionTooltip?: string;
  indicator?: "available" | "reserved" | "booked" | "sold" | "accent" | "neutral";
  tone?: "default" | "available" | "reserved" | "booked" | "sold" | "primary";
  className?: string;
}

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  caption,
  captionTooltip,
  indicator,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card card-interactive kpi flex flex-col justify-between p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
          {label}
        </p>
        {indicator && (
          <span
            className={cn(
              "size-2 rounded-full",
              indicator === "available" && "bg-available",
              indicator === "reserved" && "bg-reserved",
              indicator === "booked" && "bg-booked",
              indicator === "sold" && "bg-sold",
              indicator === "accent" && "bg-accent",
              indicator === "neutral" && "bg-line-strong",
            )}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-3">
        <span
          className={cn(
            "text-[26px] leading-none font-semibold tabular-nums sm:text-[28px]",
            tone === "available" && "text-available",
            tone === "reserved" && "text-reserved",
            tone === "booked" && "text-booked",
            tone === "sold" && "text-sold",
            tone === "primary" && "text-primary",
            tone === "default" && "text-ink",
          )}
        >
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        </span>
        {caption ? (
          <p
            className="mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums"
            title={captionTooltip || (typeof caption === "string" ? caption : undefined)}
          >
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
