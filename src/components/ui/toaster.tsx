"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-sm border border-line bg-surface text-ink text-[13px] shadow-none",
          title: "text-ink",
          description: "text-ink-muted",
        },
      }}
    />
  );
}
