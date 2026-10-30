"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Breadcrumb = { parent?: string; current: string };

const BreadcrumbContext = createContext<{
  override: Breadcrumb | null;
  setOverride: (value: Breadcrumb | null) => void;
}>({
  override: null,
  setOverride: () => undefined,
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Breadcrumb | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return (
    <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbOverride() {
  return useContext(BreadcrumbContext);
}
