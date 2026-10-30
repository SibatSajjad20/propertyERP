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
  const stringValue = String(value);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset animation with forced reflow
    setAnimating(false);
    void el.offsetWidth;
    setAnimating(true);
  }, [stringValue]);

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
        // Stagger the last few digits for alive feeling
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
