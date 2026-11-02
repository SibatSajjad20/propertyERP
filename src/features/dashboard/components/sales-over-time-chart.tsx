"use client";

import * as React from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear, scalePoint } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { formatPkrCompact } from "@/lib/money";
import type { SalesOverTimePoint } from "../queries";

interface SalesChartInnerProps {
  data: SalesOverTimePoint[];
  width: number;
  height: number;
}

function getDisplaySalesData(rawData: SalesOverTimePoint[]): SalesOverTimePoint[] {
  if (rawData.length <= 6) return rawData;
  const firstSaleIdx = rawData.findIndex(
    (d) => d.count > 0 || (Number(d.volumePkr) || 0) > 0,
  );
  if (firstSaleIdx !== -1) {
    const fromFirstSale = rawData.slice(firstSaleIdx);
    if (fromFirstSale.length < 6) {
      return rawData.slice(-6);
    }
    return fromFirstSale;
  }
  return rawData.slice(-6);
}

function SalesChartInner({ data: rawData, width, height }: SalesChartInnerProps) {
  const [activePoint, setActivePoint] = React.useState<SalesOverTimePoint | null>(null);

  // Range from the first sale or the last 6 months
  const data = getDisplaySalesData(rawData);

  const isBarChart = data.length < 4;

  const margin = { top: 24, right: 20, bottom: 32, left: 52 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const months = React.useMemo(() => data.map((d) => d.month), [data]);

  const xPointScale = React.useMemo(
    () =>
      scalePoint<string>({
        domain: months,
        range: [0, innerWidth],
        padding: 0.1,
      }),
    [months, innerWidth],
  );

  const xBandScale = React.useMemo(
    () =>
      scaleBand<string>({
        domain: months,
        range: [0, innerWidth],
        padding: 0.35,
      }),
    [months, innerWidth],
  );

  const maxVolume = React.useMemo(
    () => Math.max(1, ...data.map((d) => Number(d.volumePkr) || 0)),
    [data],
  );

  const yScale = React.useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxVolume * 1.15],
        range: [innerHeight, 0],
        nice: true,
      }),
    [innerHeight, maxVolume],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - margin.left;
      if (mouseX < 0 || mouseX > innerWidth) {
        setActivePoint(null);
        return;
      }

      let closestPoint = data[0] ?? null;
      let minDistance = Infinity;

      for (const d of data) {
        const x = isBarChart
          ? (xBandScale(d.month) ?? 0) + xBandScale.bandwidth() / 2
          : (xPointScale(d.month) ?? 0);
        const dist = Math.abs(x - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = d;
        }
      }

      setActivePoint(closestPoint);
    },
    [data, innerWidth, margin.left, isBarChart, xBandScale, xPointScale],
  );

  const handlePointerLeave = React.useCallback(() => {
    setActivePoint(null);
  }, []);

  const activeX = activePoint
    ? isBarChart
      ? (xBandScale(activePoint.month) ?? 0) + xBandScale.bandwidth() / 2
      : (xPointScale(activePoint.month) ?? 0)
    : null;
  const activeY = activePoint ? yScale(Number(activePoint.volumePkr) || 0) : null;

  return (
    <div className="relative h-full w-full select-none">
      {activePoint && (
        <div className="pointer-events-none absolute top-1 right-2 z-10 flex items-center gap-2 rounded-[6px] border border-line bg-surface/95 px-2.5 py-1 font-sans text-[11px] text-ink tabular-nums shadow-xs backdrop-blur-xs">
          <span className="font-medium text-ink-muted">{activePoint.label}:</span>
          <span className="font-semibold text-primary">
            {activePoint.count} unit{activePoint.count === 1 ? "" : "s"}
          </span>
          <span className="text-ink-muted">·</span>
          <span className="font-semibold text-ink">
            {formatPkrCompact(activePoint.volumePkr)}
          </span>
        </div>
      )}

      <svg
        width={width}
        height={height}
        className="cursor-crosshair overflow-visible"
        role="img"
        aria-label="Sales volume over time"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <style>{`
            @keyframes salesLineDraw {
              0% { stroke-dashoffset: 1400; }
              100% { stroke-dashoffset: 0; }
            }
            .sales-line-animated {
              stroke-dasharray: 1400;
              animation: salesLineDraw 800ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
          `}</style>
        </defs>
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="var(--line)"
            strokeDasharray="2 3"
            strokeOpacity={0.8}
            numTicks={4}
          />
          <AxisLeft
            scale={yScale}
            numTicks={4}
            stroke="var(--line)"
            tickStroke="var(--line)"
            tickFormat={(val) => formatPkrCompact(String(Math.round(Number(val) || 0)))}
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
            scale={isBarChart ? xBandScale : xPointScale}
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

          {isBarChart ? (
            /* Bar chart for fewer than 4 months of data */
            data.map((d) => {
              const barX = xBandScale(d.month) ?? 0;
              const barWidth = xBandScale.bandwidth();
              const val = Number(d.volumePkr) || 0;
              const barY = yScale(val);
              const barHeight = Math.max(0, innerHeight - barY);
              const isHovered = activePoint?.month === d.month;

              return (
                <rect
                  key={d.month}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="var(--primary)"
                  opacity={isHovered ? 1 : 0.85}
                  rx={4}
                  className="transition-all duration-150"
                />
              );
            })
          ) : (
            /* Smooth area chart with animated line draw-in */
            <>
              <AreaClosed<SalesOverTimePoint>
                data={data}
                x={(d) => xPointScale(d.month) ?? 0}
                y={(d) => yScale(Number(d.volumePkr) || 0)}
                yScale={yScale}
                curve={curveMonotoneX}
                fill="rgba(11, 85, 139, 0.10)"
              />

              <LinePath<SalesOverTimePoint>
                data={data}
                x={(d) => xPointScale(d.month) ?? 0}
                y={(d) => yScale(Number(d.volumePkr) || 0)}
                curve={curveMonotoneX}
                stroke="var(--primary)"
                strokeWidth={2}
                className="sales-line-animated"
              />
            </>
          )}

          {/* Hover crosshair and data point */}
          {activeX !== null && activeY !== null && (
            <g>
              <line
                x1={activeX}
                x2={activeX}
                y1={0}
                y2={innerHeight}
                stroke="var(--line-strong)"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <circle
                cx={activeX}
                cy={activeY}
                r={4.5}
                fill="var(--primary)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </g>
          )}
        </Group>
      </svg>
    </div>
  );
}

export function SalesOverTimeChart({ data }: { data: SalesOverTimePoint[] }) {
  return (
    <div className="h-full min-h-[220px] w-full">
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
