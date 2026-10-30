import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}
