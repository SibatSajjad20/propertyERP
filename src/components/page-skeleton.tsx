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
      className="flex min-h-0 flex-1 flex-col space-y-5"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mb-5 space-y-2">
        <Skeleton className="h-[24px] w-48 rounded-[6px]" />
        <Skeleton className="h-[14px] w-80 rounded-[4px]" />
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex h-[38px] items-center gap-6 border-b border-line bg-sidebar-bg px-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex h-[44px] items-center gap-6 border-b border-line px-4 last:border-b-0"
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
