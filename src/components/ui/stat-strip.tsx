import * as React from "react";
import { cn } from "@/lib/cn";

export interface StatStripProps {
  children: React.ReactNode;
  columns?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatStrip({ children, columns = 4, className, style }: StatStripProps) {
  const hasGridColsClass = Boolean(className && /\bgrid-cols-/.test(className));
  const gridTemplate = hasGridColsClass
    ? undefined
    : typeof columns === "string"
      ? columns
      : `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <div
      className={cn(
        "mb-5 grid rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className,
      )}
      style={{
        ...(gridTemplate ? { gridTemplateColumns: gridTemplate } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface StatCellProps {
  label: React.ReactNode;
  rightLabel?: React.ReactNode;
  value: React.ReactNode;
  prefixRs?: boolean;
  suffix?: React.ReactNode;
  size?: "big" | "medium";
  subLine?: React.ReactNode;
  progress?: number | { percent: number; color?: string }[];
  className?: string;
  valueClassName?: string;
}

export function StatCell({
  label,
  rightLabel,
  value,
  prefixRs = false,
  suffix,
  size = "big",
  subLine,
  progress,
  className,
  valueClassName,
}: StatCellProps) {
  return (
    <div
      className={cn(
        "min-w-0 border-l border-line p-[14px_14px_15px] first:border-l-0 xl:p-[16px_20px_17px]",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] font-medium whitespace-nowrap text-muted">
        <span className="truncate">{label}</span>
        {rightLabel && <span className="shrink-0">{rightLabel}</span>}
      </div>

      <div
        className={cn(
          "truncate leading-none font-semibold tracking-tight whitespace-nowrap text-ink tabular-nums",
          size === "big"
            ? "text-[20px] tracking-[-0.025em] lg:text-[22px] xl:text-[25px]"
            : "text-[18px] tracking-[-0.02em] lg:text-[19px] xl:text-[21px]",
          valueClassName,
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {prefixRs && (
          <span className="mr-1 text-[0.6em] font-medium tracking-normal text-muted">
            Rs
          </span>
        )}
        <span>{value}</span>
        {suffix && (
          <span className="ml-1 text-[0.6em] font-medium tracking-normal text-muted">
            {suffix}
          </span>
        )}
      </div>

      {subLine && <div className="mt-1.5 truncate text-[12px] text-muted">{subLine}</div>}

      {progress !== undefined && (
        <div
          className="mt-2.5 flex h-1 w-full overflow-hidden rounded-[2px] bg-[#EDF0F3]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {typeof progress === "number" ? (
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          ) : (
            progress.map((seg, i) => (
              <div
                key={i}
                className={cn(
                  "h-full transition-all duration-300",
                  seg.color || "bg-primary",
                )}
                style={{ width: `${Math.min(100, Math.max(0, seg.percent))}%` }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
