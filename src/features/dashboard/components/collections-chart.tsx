"use client";

import * as React from "react";
import { formatPkrCompact } from "@/lib/money";
import type { SalesOverTimePoint } from "../queries";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/cn";

export interface CollectionsChartProps {
  collectionsData: SalesOverTimePoint[];
  salesData: SalesOverTimePoint[];
  className?: string;
}

export function CollectionsChartSkeleton() {
  return (
    <div className="flex h-[262px] w-full animate-pulse items-center justify-center rounded-[12px] bg-slate-100">
      <span className="text-[12px] font-medium text-muted">
        Loading collections data…
      </span>
    </div>
  );
}

export function CollectionsChart({
  collectionsData,
  salesData,
  className,
}: CollectionsChartProps) {
  const [metric, setMetric] = React.useState<"collections" | "bookings">("collections");
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const activeSeries = metric === "collections" ? collectionsData : salesData;
  const data = activeSeries.length === 12 ? activeSeries : activeSeries.slice(-12);

  const values = data.map((d) => Number(d.volumePkr) || 0);
  const maxVal = Math.max(1, ...values);
  const totalVal = values.reduce((acc, v) => acc + v, 0);
  const avgVal = totalVal / (values.length || 1);

  // Round max for Y-axis top
  const yMax = maxVal * 1.18;
  const avgYPercent = Math.min(95, Math.max(5, (avgVal / yMax) * 100));

  const currentIdx = data.length - 1;

  return (
    <div className={cn("flex h-[262px] flex-col", className)}>
      {/* Chart controls & legend */}
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-primary" aria-hidden="true" />
            <span>Current month</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-[#B9CEE0]" aria-hidden="true" />
            <span>Past months</span>
          </span>
        </div>

        <SegmentedControl
          value={metric}
          onValueChange={(val) => setMetric(val as "collections" | "bookings")}
          size="sm"
          options={[
            { value: "collections", label: "Collections" },
            { value: "bookings", label: "Bookings value" },
          ]}
        />
      </div>

      {/* Main chart visual */}
      <div className="relative min-h-0 flex-1 pt-6 pb-6 select-none">
        {/* Horizontal gridlines */}
        <div className="pointer-events-none absolute inset-x-0 top-6 bottom-6 flex flex-col justify-between">
          <div className="w-full border-b border-[#EDEFF2]" />
          <div className="w-full border-b border-[#EDEFF2]" />
          <div className="w-full border-b border-[#EDEFF2]" />
          <div className="w-full border-b border-line" />
        </div>

        {/* 12-month avg dashed line */}
        {avgVal > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
            style={{ bottom: `calc(24px + ${avgYPercent}% * 0.76)` }}
          >
            <div className="w-full border-b border-dashed border-[#64748B]" />
            <div className="absolute -top-3 left-2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-muted shadow-2xs">
              Avg: {formatPkrCompact(String(Math.round(avgVal)))}
            </div>
          </div>
        )}

        {/* Bars row */}
        <div className="relative z-10 flex h-full items-end justify-between gap-2 px-3">
          {data.map((item, idx) => {
            const val = Number(item.volumePkr) || 0;
            const barHeightPct = Math.max(3, (val / yMax) * 100);
            const isCurrent = idx === currentIdx;
            const isHovered = hoveredIdx === idx;

            // Month short label e.g. "Nov"
            const monthShort = item.label.split(" ")[0] ?? item.month;

            return (
              <div
                key={item.month}
                className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating tooltip above current or hovered bar */}
                {(isHovered || (isCurrent && hoveredIdx === null)) && (
                  <div className="pointer-events-none absolute -top-6 z-20 rounded-[4px] bg-ink px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white shadow-xs">
                    {formatPkrCompact(String(Math.round(val)))}
                  </div>
                )}

                {/* The Bar */}
                <div className="flex h-full w-[46%] max-w-[32px] min-w-[12px] items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-[3px] transition-all duration-200",
                      isCurrent
                        ? "bg-primary group-hover:bg-primary-hover"
                        : "bg-[#B9CEE0] group-hover:bg-[#9CBAD0]",
                    )}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                {/* X axis month label */}
                <div className="absolute -bottom-5 truncate text-[11px] font-medium text-muted">
                  {monthShort}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
