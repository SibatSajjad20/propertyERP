"use client";

import { ErrorState } from "@/components/error-state";

export default function RootError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] items-start px-6 py-16">
      <ErrorState title="Something went wrong" error={error} onRetry={retry ?? reset} />
    </div>
  );
}
