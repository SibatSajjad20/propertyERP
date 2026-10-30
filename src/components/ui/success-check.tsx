"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SuccessCheckProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number;
  className?: string;
}

export function SuccessCheck({ size = 20, className, ...props }: SuccessCheckProps) {
  const [animating, setAnimating] = React.useState(true);
  const containerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setAnimating(false);
    void el.offsetWidth;
    setAnimating(true);
  }, []);

  return (
    <span
      ref={containerRef}
      className={cn(
        "t-success-check inline-flex items-center justify-center text-available",
        animating && "is-animating",
        className,
      )}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12.5L9.5 18L20 6" />
      </svg>
    </span>
  );
}
