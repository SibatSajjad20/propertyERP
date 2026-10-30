"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        className:
          "rounded-[8px] border border-line bg-surface text-ink text-[13px] shadow-floating p-3.5",
        classNames: {
          toast:
            "rounded-[8px] border border-line bg-surface text-ink text-[13px] shadow-floating flex items-center gap-3",
          title: "text-[13px] font-medium text-ink",
          description: "text-[12px] text-ink-muted",
          actionButton:
            "rounded-[4px] bg-primary text-surface px-2.5 py-1 text-[12px] font-medium hover:bg-primary-hover",
          cancelButton:
            "rounded-[4px] bg-subtle text-ink-muted px-2.5 py-1 text-[12px] font-medium hover:text-ink",
          error: "!border-[color-mix(in_srgb,var(--sold)_30%,transparent)] !text-sold",
          success:
            "!border-[color-mix(in_srgb,var(--available)_30%,transparent)] !text-available",
        },
      }}
    />
  );
}
