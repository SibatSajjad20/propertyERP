"use client";

import * as React from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { motion } from "motion/react";
import { formatPkrCompact } from "@/lib/money";
import type { SalesOverTimePoint } from "../queries";

interface SalesChartInnerProps {
  data: SalesOverTimePoint[];
  width: number;
  height: number;
}

function SalesChartInner({ data, width, height }: SalesChartInnerProps) {
  const [activePoint, setActivePoint] = React.useState<SalesOverTimePoint | null>(null);

  const margin = { top: 28, right: 16, bottom: 32, left: 36 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const xScale = React.useMemo(
    () =>
      scaleBand<string>({
        range: [0, innerWidth],
        domain: data.map((d) => d.month),
        padding: 0.35,
      }),
    [data, innerWidth],
  );

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const yScale = React.useMemo(
    () =>
      scaleLinear<number>({
        range: [innerHeight, 0],
        domain: [0, Math.ceil(maxCount * 1.2)],
        nice: true,
      }),
    [innerHeight, maxCount],
  );

  const maxVolume = Math.max(1, ...data.map((d) => Number(d.volumePkr) || 0));
  const yVolumeScale = React.useMemo(
    () =>
      scaleLinear<number>({
        range: [innerHeight - 10, 10],
        domain: [0, maxVolume * 1.15],
      }),
    [innerHeight, maxVolume],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-muted">
        No sales recorded in this period.
      </div>
    );
  }

  return (
    <div className="relative">
      {activePoint && (
        <div className="absolute top-1 right-2 z-10 flex items-center gap-2 rounded-[6px] border border-line bg-surface/95 px-2.5 py-1 font-sans text-[11px] text-ink tabular-nums shadow-xs backdrop-blur-xs">
          <span className="font-medium text-primary">{activePoint.label}:</span>
          <span>
            {activePoint.count} unit{activePoint.count === 1 ? "" : "s"}
          </span>
          <span className="text-ink-muted">·</span>
          <span className="font-semibold text-accent">
            {formatPkrCompact(activePoint.volumePkr)}
          </span>
        </div>
      )}
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        role="img"
        aria-label="Sales volume over time"
      >
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="var(--line)"
            strokeDasharray="2 3"
            strokeOpacity={0.8}
          />
          <AxisLeft
            scale={yScale}
            numTicks={4}
            stroke="var(--line)"
            tickStroke="var(--line)"
            tickLabelProps={{
              fill: "var(--ink-muted)",
              fontSize: 10,
              fontFamily: "var(--font-sans)",
              textAnchor: "end",
              dx: -4,
              dy: 3,
            }}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="var(--line)"
            tickStroke="var(--line)"
            tickFormat={(monthStr) => {
              const item = data.find((d) => d.month === monthStr);
              return item ? (item.label.split(" ")[0] ?? monthStr) : monthStr;
            }}
            tickLabelProps={{
              fill: "var(--ink-muted)",
              fontSize: 10,
              fontFamily: "var(--font-sans)",
              textAnchor: "middle",
              dy: 4,
            }}
          />

          {/* Optional volume trend line */}
          {data.length > 1 && (
            <LinePath<SalesOverTimePoint>
              data={data}
              x={(d) => (xScale(d.month) ?? 0) + xScale.bandwidth() / 2}
              y={(d) => yVolumeScale(Number(d.volumePkr) || 0)}
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeOpacity={0.5}
              strokeDasharray="3 3"
            />
          )}

          {data.map((d, index) => {
            const barWidth = xScale.bandwidth();
            const barHeight = Math.max(2, innerHeight - (yScale(d.count) ?? 0));
            const barX = xScale(d.month) ?? 0;
            const barY = innerHeight - barHeight;
            const isHovered = activePoint?.month === d.month;

            return (
              <g key={d.month}>
                <motion.rect
                  x={barX}
                  width={barWidth}
                  rx={4}
                  initial={{ y: innerHeight, height: 0 }}
                  animate={{
                    y: isHovered ? barY - 2 : barY,
                    height: isHovered ? barHeight + 2 : barHeight,
                  }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  fill={isHovered ? "var(--primary-hover)" : "var(--primary)"}
                  className="cursor-pointer transition-colors duration-150"
                  onMouseEnter={() => setActivePoint(d)}
                  onMouseLeave={() => setActivePoint(null)}
                />
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  x={barX + barWidth / 2}
                  y={barY - 5}
                  textAnchor="middle"
                  fill={isHovered ? "var(--primary)" : "var(--ink-muted)"}
                  fontSize={10}
                  className="font-sans tabular-nums select-none"
                >
                  {d.count}
                </motion.text>
              </g>
            );
          })}
        </Group>
      </svg>
    </div>
  );
}

export function SalesOverTimeChart({ data }: { data: SalesOverTimePoint[] }) {
  return (
    <div className="h-[210px] w-full">
      <ParentSize debounceTime={50}>
        {({ width, height }) =>
          width > 0 && height > 0 ? (
            <SalesChartInner data={data} width={width} height={height} />
          ) : null
        }
      </ParentSize>
    </div>
  );
}
