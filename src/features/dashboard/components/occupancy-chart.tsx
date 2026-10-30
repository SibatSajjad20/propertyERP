"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

type OccupancyPoint = {
  label: string;
  value: number;
  color: string;
};

type OccupancyChartProps = {
  data: OccupancyPoint[];
};

const width = 420;
const height = 220;
const margin = { top: 12, right: 12, bottom: 36, left: 36 };

export function OccupancyChart({ data }: OccupancyChartProps) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x = scaleBand<string>({
    domain: data.map((d) => d.label),
    range: [0, innerWidth],
    padding: 0.35,
  });
  const max = Math.max(1, ...data.map((d) => d.value));
  const y = scaleLinear<number>({
    domain: [0, max],
    range: [innerHeight, 0],
    nice: true,
  });

  return (
    <svg width={width} height={height} role="img" aria-label="Occupancy by status">
      <Group top={margin.top} left={margin.left}>
        <AxisLeft
          scale={y}
          stroke="var(--line)"
          tickStroke="var(--line)"
          tickLabelProps={{
            fill: "var(--ink-muted)",
            fontSize: 11,
            textAnchor: "end",
            dx: -4,
          }}
        />
        <AxisBottom
          scale={x}
          top={innerHeight}
          stroke="var(--line)"
          tickStroke="var(--line)"
          tickLabelProps={{
            fill: "var(--ink-muted)",
            fontSize: 11,
            textAnchor: "middle",
          }}
        />
        {data.map((d) => {
          const barX = x(d.label) ?? 0;
          const barY = y(d.value);
          return (
            <Bar
              key={d.label}
              x={barX}
              y={barY}
              width={x.bandwidth()}
              height={innerHeight - barY}
              fill={d.color}
            />
          );
        })}
      </Group>
    </svg>
  );
}
