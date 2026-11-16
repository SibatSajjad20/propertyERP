import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sardar's Mall ERP",
    template: "%s · Sardar's Mall ERP",
  },
  description: "Property and inventory ledger for Sardar's Mall.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg font-sans text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-1 focus:text-[13px]"
        >
          Skip to content
        </a>
        <QueryProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
