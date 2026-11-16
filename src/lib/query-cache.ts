"use client";

import { useState } from "react";

/**
 * Hydrate TanStack Query from an RSC payload without an immediate refetch.
 * `initialDataUpdatedAt` is captured once on mount so re-renders do not reset staleness.
 */
export function useServerInitialData<T>(data: T | undefined) {
  const [hydratedAt] = useState(() => Date.now());
  if (data === undefined) return {};
  return {
    initialData: data,
    initialDataUpdatedAt: hydratedAt,
  };
}
