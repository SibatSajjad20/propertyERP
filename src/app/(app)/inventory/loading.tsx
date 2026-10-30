"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleNotch } from "@phosphor-icons/react";

export default function InventoryLoading() {
  const [showWakingNotice, setShowWakingNotice] = React.useState(false);

  React.useEffect(() => {
    // Show "Waking database..." only if real cold-start loading exceeds 3.5 seconds
    const timer = setTimeout(() => {
      setShowWakingNotice(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4" aria-live="polite">
      {/* Toolbar skeleton */}
      <div className="card flex h-14 items-center justify-between p-3">
        <Skeleton className="h-8 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {showWakingNotice && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-[8px] border border-accent/30 bg-accent/5 px-3.5 py-2 text-[12px] text-ink-muted">
          <CircleNotch weight="light" className="size-4 animate-spin text-accent" />
          <span>Waking the database. This can take a few seconds after idle time…</span>
        </div>
      )}

      {/* 4 Overview Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex flex-col justify-between space-y-2 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-9 items-center gap-6 border-b border-line-strong bg-subtle/30 px-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="divide-y divide-line p-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex h-9 items-center gap-6 px-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
