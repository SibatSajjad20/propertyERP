"use client";

import { Button } from "@/components/ui/button";

export default function InventoryError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const message = error instanceof Error ? error.message : "Could not load inventory.";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-start gap-3">
      <p className="font-display text-[22px] text-ink">Inventory could not be loaded</p>
      <p className="text-[13px] text-ink-muted">{message}</p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
