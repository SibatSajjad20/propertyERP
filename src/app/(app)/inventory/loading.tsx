import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4" aria-live="polite">
      {/* Toolbar skeleton */}
      <div className="flex h-14 items-center justify-between rounded-[8px] border border-line bg-surface p-3">
        <Skeleton className="h-8 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-line bg-surface">
        <div className="flex h-9 items-center gap-6 border-b border-line-strong bg-surface px-3">
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
