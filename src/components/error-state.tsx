"use client";

import { Button } from "@/components/ui/button";
import { WAKING_DB_MESSAGE, isTransientDbError } from "@/lib/db-errors";
import { errorMessage } from "@/lib/errors";

export function ErrorState({
  title = "This page could not be loaded",
  error,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const waking = isTransientDbError(error);
  const message = waking ? WAKING_DB_MESSAGE : errorMessage(error);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-start gap-3 py-6">
      <h1 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="max-w-lg text-[13px] text-ink-muted">{message}</p>
      {waking ? (
        <p className="text-[12px] text-ink-faint">
          Neon pauses idle databases. Wait a moment and try again.
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="primary" size="md" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function NotFoundState({
  title = "Page not found",
  description = "That address is not in this ledger. Check the link or jump from Inventory.",
  href = "/inventory",
  actionLabel = "Back to inventory",
}: {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-start gap-3 py-6">
      <p className="font-mono text-[12px] tracking-widest text-ink-muted uppercase">
        404
      </p>
      <h1 className="text-[20px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="max-w-lg text-[13px] text-ink-muted">{description}</p>
      <Button variant="secondary" size="md" asChild>
        <a href={href}>{actionLabel}</a>
      </Button>
    </div>
  );
}
