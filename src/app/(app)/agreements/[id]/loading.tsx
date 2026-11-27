import { Skeleton } from "@/components/ui/skeleton";

export default function AgreementDetailLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6" aria-live="polite">
      {/* Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-32 rounded-[8px]" />
        </div>
      </div>

      {/* StatStrip Skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card flex flex-col justify-between space-y-2 rounded-[12px] p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Grid Panels Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-4 rounded-[12px] p-5 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 rounded-[8px]" />
            <Skeleton className="h-10 rounded-[8px]" />
            <Skeleton className="h-10 rounded-[8px]" />
            <Skeleton className="h-10 rounded-[8px]" />
          </div>
          <Skeleton className="h-20 rounded-[8px]" />
        </div>
        <div className="card space-y-4 rounded-[12px] p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-40 rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}
