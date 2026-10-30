import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton({ hideAudit = false }: { hideAudit?: boolean }) {
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

      {/* KPI Row Skeleton (6 columns separated by hairlines) */}
      <div className="grid grid-cols-2 divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-y-0 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between space-y-3 p-4 sm:p-5">
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

          <div className="divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="w-24 shrink-0 space-y-1">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-2 w-full rounded-full" />
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
            <div className="space-y-3 overflow-hidden rounded-[8px] border border-line bg-surface p-4">
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
            <div className="flex h-[210px] items-center justify-center rounded-[8px] border border-line bg-surface p-4">
              <Skeleton className="h-full w-full" />
            </div>
          </div>

          {/* Recent Activity Skeleton (if not hidden for SALES) */}
          {!hideAudit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface">
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
