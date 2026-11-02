"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: string | number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  className,
  prefix,
  suffix,
  ...props
}: AnimatedNumberProps) {
  const containerRef = React.useRef<HTMLSpanElement>(null);
  const [animating, setAnimating] = React.useState(true);

  // Numerical count-up for numbers
  const isNumeric =
    typeof value === "number" ||
    (!Number.isNaN(Number(value)) && /^\d+$/.test(String(value).trim()));
  const targetNum = isNumeric ? Number(value) : null;
  const [displayNum, setDisplayNum] = React.useState<number | null>(
    targetNum !== null ? 0 : null,
  );

  React.useEffect(() => {
    if (targetNum === null) return;
    let frameId: number;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      frameId = requestAnimationFrame(() => {
        setDisplayNum(targetNum);
      });
      return () => cancelAnimationFrame(frameId);
    }
    const duration = 500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(Math.round(eased * targetNum));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayNum(targetNum);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targetNum]);

  const stringValue = displayNum !== null ? String(displayNum) : String(value);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setAnimating(false);
    void el.offsetWidth;
    setAnimating(true);
  }, [value]);

  const chars = stringValue.split("");
  const totalChars = chars.length;

  return (
    <span
      ref={containerRef}
      className={cn(
        "t-digit-group font-sans tabular-nums",
        animating && "is-animating",
        className,
      )}
      {...props}
    >
      {prefix && <span className="t-digit mr-0.5">{prefix}</span>}
      {chars.map((char, index) => {
        const distanceFromEnd = totalChars - 1 - index;
        const stagger =
          distanceFromEnd === 0 ? "2" : distanceFromEnd === 1 ? "1" : undefined;

        return (
          <span key={`${index}-${char}`} className="t-digit" data-stagger={stagger}>
            {char}
          </span>
        );
      })}
      {suffix && <span className="t-digit ml-0.5">{suffix}</span>}
    </span>
  );
}
