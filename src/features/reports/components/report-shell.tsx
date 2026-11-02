"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DownloadSimple,
  Printer,
  MagnifyingGlass,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { reportPresets, type ReportPreset } from "../schema";

export interface ReportStatCard {
  label: string;
  value: string;
  subValue?: string;
  tone?: "primary" | "accent" | "sold" | "available" | "neutral";
}

export interface ReportFilterConfig {
  showFloors?: boolean;
  showBlocks?: boolean;
  showCategories?: boolean;
  showStatus?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
  showSearch?: boolean;
  searchPlaceholder?: string;
  quickFilters?: Array<{ value: string; label: string }>;
}

export interface ReportShellProps {
  title: string;
  description: string;
  exportType:
    "summary" | "sold" | "booked" | "reserved" | "installments" | "client-ledger";
  stats?: ReportStatCard[];
  filterConfig?: ReportFilterConfig;
  filterOptions?: {
    blocks: Array<{ id: string; name: string }>;
    floors: Array<{ id: string; name: string; level: number }>;
    categories: Array<{ id: string; name: string }>;
  };
  children: React.ReactNode;
}

const PRESET_LABELS: Record<ReportPreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  custom: "Custom",
  all: "All Time",
};

export function ReportShell({
  title,
  description,
  exportType,
  stats = [],
  filterConfig = {},
  filterOptions,
  children,
}: ReportShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPreset = (searchParams.get("preset") as ReportPreset) || "this_month";
  const currentStart = searchParams.get("startDate") || "";
  const currentEnd = searchParams.get("endDate") || "";
  const currentFloor = searchParams.get("floorId") || "ALL";
  const currentCategory = searchParams.get("categoryId") || "ALL";
  const currentBlock = searchParams.get("blockId") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentQuick = searchParams.get("quickFilter") || "all";
  const currentQ = searchParams.get("q") || "";

  const [searchVal, setSearchVal] = React.useState(currentQ);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Update URL params helper
  const updateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "" || val === "ALL" || val === "all") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}` as never);
      });
    },
    [pathname, router, searchParams],
  );

  function handlePresetChange(val: string) {
    if (val === "custom") {
      updateParams({ preset: val });
    } else {
      updateParams({ preset: val, startDate: null, endDate: null });
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchVal.trim() });
  }

  function handleResetFilters() {
    setSearchVal("");
    startTransition(() => {
      router.push(pathname as never);
    });
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true);
      const url = `/api/export/reports/${exportType}?${searchParams.toString()}`;
      window.open(url, "_blank");
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 p-4 transition-opacity duration-150 select-none sm:p-6 print:p-0",
        isPending && "opacity-60",
      )}
    >
      {/* Printable mall header (visible ONLY during print) */}
      <div className="hidden print:mb-6 print:flex print:flex-col print:border-b-2 print:border-[#9A7B4F] print:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-xs bg-[#9A7B4F]" />
            <h1 className="text-2xl font-bold text-[#0F172A]">Sardar&apos;s Mall ERP</h1>
          </div>
          <span className="font-mono text-xs text-[#64748B]">
            Report Generated: {new Date().toLocaleDateString("en-US")}
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-[#0F172A]">{title}</div>
        <div className="text-xs text-[#64748B]">
          Filter: {PRESET_LABELS[currentPreset]}
          {currentFloor !== "ALL" && ` | Floor: ${currentFloor}`}
          {currentCategory !== "ALL" && ` | Category: ${currentCategory}`}
        </div>
      </div>

      {/* Screen Page Header */}
      <div className="space-y-4 print:hidden">
        <PageHeader
          title={title}
          description={description}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={handlePrint}>
                <Printer weight="light" className="size-4" />
                <span>Print / PDF</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <DownloadSimple weight="light" className="size-4" />
                <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
              </Button>
            </div>
          }
        />

        {/* Reports Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-line">
          {[
            { href: "/reports/summary" as Route, label: "Summary" },
            { href: "/reports/sold" as Route, label: "Sold" },
            { href: "/reports/booked" as Route, label: "Booked" },
            { href: "/reports/reserved" as Route, label: "Reserved" },
            { href: "/reports/installments" as Route, label: "Collections" },
            { href: "/reports/client-ledger" as Route, label: "Client ledger" },
          ].map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href === "/reports/summary" && pathname === "/reports");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "-mb-px border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filter Bar (screen only) */}
      <div className="card flex flex-col gap-3 rounded-[12px] p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-medium text-ink-muted">Period:</span>
            {reportPresets.map((preset) => {
              const active = currentPreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetChange(preset)}
                  className={cn(
                    "cursor-pointer rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "bg-subtle text-ink-muted hover:bg-subtle/80 hover:text-ink",
                  )}
                >
                  {PRESET_LABELS[preset]}
                </button>
              );
            })}
          </div>

          {/* Quick Filters (if configured) */}
          {filterConfig.quickFilters && filterConfig.quickFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-medium text-ink-muted">Quick:</span>
              {filterConfig.quickFilters.map((qf) => {
                const active = currentQuick === qf.value;
                return (
                  <button
                    key={qf.value}
                    type="button"
                    onClick={() => updateParams({ quickFilter: qf.value })}
                    className={cn(
                      "cursor-pointer rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                      active
                        ? "bg-accent text-white"
                        : "bg-subtle text-ink-muted hover:bg-subtle/80 hover:text-ink",
                    )}
                  >
                    {qf.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom date range pickers if preset === custom */}
        {currentPreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">From:</span>
              <input
                type="date"
                value={currentStart}
                onChange={(e) => updateParams({ startDate: e.target.value })}
                className="h-9 rounded-[8px] border border-line bg-surface px-2.5 text-[13px] text-ink focus:outline-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">To:</span>
              <input
                type="date"
                value={currentEnd}
                onChange={(e) => updateParams({ endDate: e.target.value })}
                className="h-9 rounded-[8px] border border-line bg-surface px-2.5 text-[13px] text-ink focus:outline-primary"
              />
            </div>
          </div>
        )}

        {/* Dropdown selects & search */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
          {filterConfig.showFloors && filterOptions?.floors && (
            <div className="w-40">
              <Select
                value={currentFloor}
                onValueChange={(val) => updateParams({ floorId: val })}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Floors</SelectItem>
                  {filterOptions.floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showCategories && filterOptions?.categories && (
            <div className="w-40">
              <Select
                value={currentCategory}
                onValueChange={(val) => updateParams({ categoryId: val })}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {filterOptions.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showBlocks && filterOptions?.blocks && (
            <div className="w-36">
              <Select
                value={currentBlock}
                onValueChange={(val) => updateParams({ blockId: val })}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="All Blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Blocks</SelectItem>
                  {filterOptions.blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showStatus && filterConfig.statusOptions && (
            <div className="w-36">
              <Select
                value={currentStatus}
                onValueChange={(val) => updateParams({ status: val })}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {filterConfig.statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterConfig.showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className="flex min-w-[200px] flex-1 items-center gap-1.5"
            >
              <div className="relative flex-1">
                <MagnifyingGlass
                  weight="light"
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
                />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder={filterConfig.searchPlaceholder || "Search..."}
                  className="h-9 w-full rounded-[8px] border border-line bg-surface pr-3 pl-8 text-[13px] text-ink placeholder:text-ink-faint focus:outline-primary"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-ink-muted hover:text-ink"
            title="Reset filters"
          >
            <ArrowClockwise weight="light" className="mr-1 size-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards on top */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 print:grid-cols-4 print:gap-2">
          {stats.map((stat, idx) => {
            const toneBorder =
              stat.tone === "accent"
                ? "border-l-accent"
                : stat.tone === "available"
                  ? "border-l-available"
                  : stat.tone === "sold"
                    ? "border-l-sold"
                    : stat.tone === "primary"
                      ? "border-l-primary"
                      : "border-l-line-strong";

            return (
              <div
                key={idx}
                className={cn(
                  "card flex flex-col justify-between rounded-[12px] border-l-4 p-3.5 transition-transform hover:-translate-y-0.5",
                  toneBorder,
                )}
              >
                <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                  {stat.label}
                </span>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="font-sans text-[18px] font-semibold tracking-tight text-ink tabular-nums sm:text-[20px]">
                    {stat.value}
                  </span>
                </div>
                {stat.subValue && (
                  <span className="mt-0.5 font-sans text-[11px] text-ink-muted tabular-nums">
                    {stat.subValue}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Content */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
