import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton({ hideAudit = false }: { hideAudit?: boolean }) {
  return (
    <div
      className="animate-fade-in space-y-6"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Row 1: 6 Stat Cards */}
      <div className="grid auto-rows-fr grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card flex flex-col justify-between space-y-3 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Row 2: 3 Needs Attention Cards */}
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card flex flex-col justify-between space-y-3 p-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Row 3: Sales Chart (2/3) + Donut (1/3) */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="card flex flex-col space-y-4 p-5 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="h-[240px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        </div>

        <div className="card flex flex-col space-y-4 p-5 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <Skeleton className="size-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Row 4: Floor Stack (2/3) + Recent Activity (1/3) */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="card flex flex-col space-y-4 p-5 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="divide-y divide-line">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2.5">
                <Skeleton className="h-4 w-20 shrink-0" />
                <Skeleton className="h-3 flex-1 rounded-[8px]" />
                <Skeleton className="h-4 w-24 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {!hideAudit && (
          <div className="card flex flex-col space-y-4 p-5 lg:col-span-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="divide-y divide-line">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
