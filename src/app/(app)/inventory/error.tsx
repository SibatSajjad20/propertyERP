"use client";

import { ErrorState } from "@/components/error-state";

export default function InventoryError({
  error,
  reset,
  retry,
}: {
  error: unknown;
  reset?: () => void;
  retry?: () => void;
}) {
  return (
    <ErrorState
      title="Inventory could not be loaded"
      error={error}
      onRetry={retry ?? reset}
    />
  );
}
