"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleNotch } from "@phosphor-icons/react";

export function DashboardSkeleton({ hideAudit = false }: { hideAudit?: boolean }) {
  const [showWakingNotice, setShowWakingNotice] = React.useState(false);

  React.useEffect(() => {
    // Show "Waking database..." only if real cold-start loading exceeds 3.5 seconds
    const timer = setTimeout(() => {
      setShowWakingNotice(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="animate-fade-in space-y-8"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {showWakingNotice && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-[8px] border border-accent/30 bg-accent/5 px-3.5 py-2 text-[12px] text-ink-muted">
          <CircleNotch weight="light" className="size-4 animate-spin text-accent" />
          <span>Waking the database. This can take a few seconds after idle time…</span>
        </div>
      )}

      {/* KPI Cards Skeleton (separate cards) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card flex flex-col justify-between space-y-3 p-4 sm:p-5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): Floor Ledger */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>

          <div className="card divide-y divide-line overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="w-24 shrink-0 space-y-1">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
                <div className="w-28 shrink-0 space-y-1 text-right">
                  <Skeleton className="ml-auto h-3.5 w-20" />
                  <Skeleton className="ml-auto h-2.5 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Block Breakdown + Sales Over Time + Recent Activity */}
        <div className="space-y-8 lg:col-span-5">
          {/* Block Breakdown Skeleton */}
          <div className="space-y-4">
            <div className="border-b border-line pb-2.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-40" />
            </div>
            <div className="card space-y-3 overflow-hidden p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          {/* Sales Over Time Chart Skeleton */}
          <div className="space-y-4">
            <div className="border-b border-line pb-2.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1 h-3 w-44" />
            </div>
            <div className="card flex h-[210px] items-center justify-center overflow-hidden p-4">
              <Skeleton className="h-full w-full" />
            </div>
          </div>

          {/* Recent Activity Skeleton */}
          {!hideAudit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="card divide-y divide-line overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
