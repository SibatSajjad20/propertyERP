import { Skeleton } from "@/components/ui/skeleton";

export default function AgreementsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-5" aria-live="polite">
      {/* PageHeader Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-[8px]" />
      </div>

      {/* KPI StatStrip Skeleton (4 cards) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card flex flex-col justify-between space-y-2 rounded-[12px] p-5"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Filter Toolbar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-[8px]" />
        <Skeleton className="h-9 w-64 rounded-[8px]" />
      </div>

      {/* Agreements Table Skeleton */}
      <div className="card overflow-hidden rounded-[10px]">
        <div className="flex h-[38px] items-center gap-6 border-b border-line bg-[#FAFBFC] px-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="ml-auto h-3.5 w-28" />
        </div>
        <div className="divide-y divide-line p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex h-12 items-center gap-6 px-4">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="ml-auto flex items-center gap-1.5">
                <Skeleton className="size-7 rounded-[6px]" />
                <Skeleton className="size-7 rounded-[6px]" />
                <Skeleton className="size-7 rounded-[6px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
