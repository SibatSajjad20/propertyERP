"use client";

import { useEffect } from "react";
import { useBreadcrumbOverride, type Breadcrumb } from "./breadcrumb-context";

export function BreadcrumbSet({ parent, current }: Breadcrumb) {
  const { setOverride } = useBreadcrumbOverride();
  useEffect(() => {
    setOverride({ parent, current });
    return () => setOverride(null);
  }, [parent, current, setOverride]);
  return null;
}
