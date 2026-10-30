import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  rows = 8,
  label = "Loading…",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col space-y-4"
      aria-live="polite"
      aria-label={label}
    >
      <div className="space-y-2 border-b border-line pb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
        <div className="flex h-9 items-center gap-6 border-b border-line-strong px-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex h-9 items-center gap-6 border-b border-line px-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
