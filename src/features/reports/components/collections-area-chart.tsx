"use client";

import * as React from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scalePoint } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { formatPkrCompact } from "@/lib/money";

export interface MonthlyCollectionPoint {
  month: string;
  label: string;
  collectedPkr: string;
  amount: number;
}

interface ChartInnerProps {
  data: MonthlyCollectionPoint[];
  width: number;
  height: number;
}

function ChartInner({ data, width, height }: ChartInnerProps) {
  const [activePoint, setActivePoint] = React.useState<MonthlyCollectionPoint | null>(
    null,
  );

  const margin = { top: 20, right: 20, bottom: 32, left: 56 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const months = React.useMemo(() => data.map((d) => d.month), [data]);

  const xScale = React.useMemo(
    () =>
      scalePoint<string>({
        domain: months,
        range: [0, innerWidth],
        padding: 0.1,
      }),
    [months, innerWidth],
  );

  const maxAmount = React.useMemo(
    () => Math.max(1, ...data.map((d) => d.amount || 0)),
    [data],
  );

  const yScale = React.useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxAmount * 1.15],
        range: [innerHeight, 0],
        nice: true,
      }),
    [innerHeight, maxAmount],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - margin.left;
      if (mouseX < 0 || mouseX > innerWidth || data.length === 0) {
        setActivePoint(null);
        return;
      }

      let closest = data[0]!;
      let minDistance = Infinity;

      for (const d of data) {
        const x = xScale(d.month) ?? 0;
        const dist = Math.abs(x - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          closest = d;
        }
      }

      setActivePoint(closest);
    },
    [data, innerWidth, margin.left, xScale],
  );

  const handlePointerLeave = React.useCallback(() => {
    setActivePoint(null);
  }, []);

  const activeX = activePoint ? (xScale(activePoint.month) ?? 0) : null;
  const activeY = activePoint ? yScale(activePoint.amount) : null;

  return (
    <div className="relative h-full w-full select-none">
      {activePoint && (
        <div className="pointer-events-none absolute top-1 right-2 z-10 flex items-center gap-2 rounded-[8px] border border-border bg-surface px-2.5 py-1.5 font-sans text-[11px] text-ink tabular-nums shadow-card">
          <span className="font-medium text-ink-muted">{activePoint.label}:</span>
          <span className="font-semibold text-primary">
            {formatPkrCompact(activePoint.collectedPkr)}
          </span>
        </div>
      )}

      <svg
        width={width}
        height={height}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="collections-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B558B" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#0B558B" stopOpacity={0} />
          </linearGradient>
        </defs>

        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="#EDF0F3"
            strokeOpacity={1}
            strokeDasharray="2,3"
            numTicks={4}
          />

          {data.length > 0 && (
            <>
              <AreaClosed<MonthlyCollectionPoint>
                data={data}
                x={(d) => xScale(d.month) ?? 0}
                y={(d) => yScale(d.amount)}
                yScale={yScale}
                curve={curveMonotoneX}
                fill="url(#collections-area-gradient)"
              />

              <LinePath<MonthlyCollectionPoint>
                data={data}
                x={(d) => xScale(d.month) ?? 0}
                y={(d) => yScale(d.amount)}
                curve={curveMonotoneX}
                stroke="var(--primary)"
                strokeWidth={2}
              />

              {data.map((d) => {
                const cx = xScale(d.month) ?? 0;
                const cy = yScale(d.amount);
                const isActive = activePoint?.month === d.month;
                return (
                  <circle
                    key={d.month}
                    cx={cx}
                    cy={cy}
                    r={isActive ? 4.5 : 2.5}
                    fill={isActive ? "var(--accent-bright)" : "var(--primary)"}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    className="transition-all duration-150"
                  />
                );
              })}
            </>
          )}

          {activeX !== null && activeY !== null && (
            <line
              x1={activeX}
              x2={activeX}
              y1={0}
              y2={innerHeight}
              stroke="var(--accent-bright)"
              strokeWidth={1}
              strokeDasharray="3,3"
              pointerEvents="none"
            />
          )}

          <AxisLeft
            scale={yScale}
            numTicks={4}
            stroke="#EEF1F4"
            tickStroke="#EEF1F4"
            tickFormat={(val) => {
              const num = typeof val === "number" ? val : Number(val);
              if (num === 0) return "Rs 0";
              if (num >= 10_000_000) return `${(num / 10_000_000).toFixed(1)} Cr`;
              if (num >= 100_000) return `${(num / 100_000).toFixed(0)} Lac`;
              return `${num.toLocaleString()}`;
            }}
            tickLabelProps={{
              fill: "#94A3B8",
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: 10,
              textAnchor: "end",
              dx: -4,
              dy: 3,
            }}
          />

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="#EEF1F4"
            tickStroke="#EEF1F4"
            tickFormat={(m) => {
              const point = data.find((d) => d.month === m);
              return point ? point.label : (m as string);
            }}
            tickLabelProps={{
              fill: "#94A3B8",
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: 10,
              textAnchor: "middle",
              dy: 4,
            }}
          />
        </Group>
      </svg>
    </div>
  );
}

export function CollectionsAreaChart({ data }: { data: MonthlyCollectionPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-[12px] text-ink-muted">
        No payment collection data in this period.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ParentSize debounceTime={100}>
        {({ width, height }) => <ChartInner data={data} width={width} height={height} />}
      </ParentSize>
    </div>
  );
}
