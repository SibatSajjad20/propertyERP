"use client";

import { ErrorState } from "@/components/error-state";

export default function AppError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  return <ErrorState error={error} onRetry={retry ?? reset} />;
}
