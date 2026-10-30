import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sardar's Mall ERP",
    template: "%s · Sardar's Mall ERP",
  },
  description: "Property and inventory ledger for Sardar's Mall.",
};

function ShellFallback() {
  return (
    <div className="flex min-h-full items-center justify-center text-[13px] text-ink-muted">
      Loading ledger…
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-1 focus:text-[13px]"
        >
          Skip to content
        </a>
        <Suspense fallback={<ShellFallback />}>{children}</Suspense>
        <Toaster />
      </body>
    </html>
  );
}
