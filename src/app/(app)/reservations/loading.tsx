import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4" aria-live="polite">
      {/* 4 Overview Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex flex-col justify-between space-y-2 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="card flex h-14 items-center justify-between p-3">
        <Skeleton className="h-9 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
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
          {Array.from({ length: 10 }).map((_, i) => (
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
