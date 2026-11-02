"use client";

import * as React from "react";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { Pie } from "@visx/shape";
import { motion } from "motion/react";
import { formatPkrCompact } from "@/lib/money";

interface SliceData {
  key: string;
  label: string;
  value: number;
  color: string;
  formatted: string;
}

interface DonutInnerProps {
  availableValuePkr: string;
  reservedValuePkr?: string;
  bookedValuePkr?: string;
  soldValuePkr: string;
  width: number;
  height: number;
}

function DonutInner({
  availableValuePkr,
  reservedValuePkr = "0",
  bookedValuePkr = "0",
  soldValuePkr,
  width,
  height,
}: DonutInnerProps) {
  const availNum = Math.max(0, Number(availableValuePkr) || 0);
  const resNum = Math.max(0, Number(reservedValuePkr) || 0);
  const bkNum = Math.max(0, Number(bookedValuePkr) || 0);
  const soldNum = Math.max(0, Number(soldValuePkr) || 0);
  const totalNum = availNum + resNum + bkNum + soldNum;

  const soldPercent = totalNum > 0 ? (soldNum / totalNum) * 100 : 0;
  const availPercent = totalNum > 0 ? (availNum / totalNum) * 100 : 0;
  const resPercent = totalNum > 0 ? (resNum / totalNum) * 100 : 0;
  const bkPercent = totalNum > 0 ? (bkNum / totalNum) * 100 : 0;

  const slices: SliceData[] = React.useMemo(() => {
    if (totalNum === 0) {
      return [
        {
          key: "empty",
          label: "No units",
          value: 1,
          color: "var(--line)",
          formatted: "Rs 0",
        },
      ];
    }
    const result: SliceData[] = [];
    if (availNum > 0) {
      result.push({
        key: "available",
        label: "Available",
        value: availNum,
        color: "#1F7A4D",
        formatted: formatPkrCompact(availableValuePkr),
      });
    }
    if (resNum > 0) {
      result.push({
        key: "reserved",
        label: "Reserved",
        value: resNum,
        color: "#B7791F",
        formatted: formatPkrCompact(reservedValuePkr),
      });
    }
    if (bkNum > 0) {
      result.push({
        key: "booked",
        label: "Booked",
        value: bkNum,
        color: "#0B558B",
        formatted: formatPkrCompact(bookedValuePkr),
      });
    }
    if (soldNum > 0) {
      result.push({
        key: "sold",
        label: "Sold",
        value: soldNum,
        color: "#9B2C2C",
        formatted: formatPkrCompact(soldValuePkr),
      });
    }
    return result;
  }, [
    availNum,
    resNum,
    bkNum,
    soldNum,
    totalNum,
    availableValuePkr,
    reservedValuePkr,
    bookedValuePkr,
    soldValuePkr,
  ]);

  // Height allocated for legend is roughly 64px
  const availableChartHeight = Math.max(120, height - 72);
  const size = Math.min(width, availableChartHeight);
  const radius = Math.max(30, size / 2 - 8);
  const donutThickness = Math.min(22, radius * 0.32);
  const innerRadius = radius - donutThickness;

  const centerX = width / 2;
  const centerY = availableChartHeight / 2;

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden">
      <div className="relative flex min-h-[140px] flex-1 items-center justify-center">
        <svg width={width} height={availableChartHeight} className="overflow-visible">
          <Group top={centerY} left={centerX}>
            <Pie<SliceData>
              data={slices}
              pieValue={(d) => d.value}
              outerRadius={radius}
              innerRadius={innerRadius}
              padAngle={0.03}
              cornerRadius={3}
            >
              {(pie) =>
                pie.arcs.map((arc, index) => {
                  const pathData = pie.path(arc) || "";

                  return (
                    <motion.path
                      key={arc.data.key}
                      d={pathData}
                      fill={arc.data.color}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="transition-opacity hover:opacity-90"
                    />
                  );
                })
              }
            </Pie>
          </Group>
        </svg>

        {/* Center label */}
        <div
          className="pointer-events-none absolute flex flex-col items-center justify-center text-center"
          style={{
            top: centerY - innerRadius,
            left: centerX - innerRadius,
            height: innerRadius * 2,
            width: innerRadius * 2,
          }}
        >
          <span className="text-[24px] leading-none font-bold text-ink tabular-nums sm:text-[26px]">
            {soldPercent.toFixed(0)}%
          </span>
          <span className="mt-1 text-[10px] font-medium tracking-wider text-ink-muted uppercase">
            Sold
          </span>
        </div>
      </div>

      {/* Legend in 2 columns, no clipping */}
      <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-[11px]">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full bg-available"
            aria-hidden="true"
          />
          <span className="truncate text-ink-muted">Available:</span>
          <span className="ml-auto shrink-0 font-semibold text-ink tabular-nums">
            {formatPkrCompact(availableValuePkr)}
          </span>
          <span className="shrink-0 text-[10px] text-ink-muted tabular-nums">
            ({availPercent.toFixed(0)}%)
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-reserved" aria-hidden="true" />
          <span className="truncate text-ink-muted">Reserved:</span>
          <span className="ml-auto shrink-0 font-semibold text-ink tabular-nums">
            {formatPkrCompact(reservedValuePkr)}
          </span>
          <span className="shrink-0 text-[10px] text-ink-muted tabular-nums">
            ({resPercent.toFixed(0)}%)
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-booked" aria-hidden="true" />
          <span className="truncate text-ink-muted">Booked:</span>
          <span className="ml-auto shrink-0 font-semibold text-ink tabular-nums">
            {formatPkrCompact(bookedValuePkr)}
          </span>
          <span className="shrink-0 text-[10px] text-ink-muted tabular-nums">
            ({bkPercent.toFixed(0)}%)
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-sold" aria-hidden="true" />
          <span className="truncate text-ink-muted">Sold:</span>
          <span className="ml-auto shrink-0 font-semibold text-ink tabular-nums">
            {formatPkrCompact(soldValuePkr)}
          </span>
          <span className="shrink-0 text-[10px] text-ink-muted tabular-nums">
            ({soldPercent.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export function InventoryMixDonut({
  availableValuePkr,
  reservedValuePkr,
  bookedValuePkr,
  soldValuePkr,
}: {
  availableValuePkr: string;
  reservedValuePkr?: string;
  bookedValuePkr?: string;
  soldValuePkr: string;
}) {
  return (
    <div className="h-full min-h-[240px] w-full">
      <ParentSize debounceTime={50}>
        {({ width, height }) =>
          width > 0 && height > 0 ? (
            <DonutInner
              availableValuePkr={availableValuePkr}
              reservedValuePkr={reservedValuePkr}
              bookedValuePkr={bookedValuePkr}
              soldValuePkr={soldValuePkr}
              width={width}
              height={height}
            />
          ) : null
        }
      </ParentSize>
    </div>
  );
}
