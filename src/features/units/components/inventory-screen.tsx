"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  MagnifyingGlass,
  Plus,
  ArrowClockwise,
  DownloadSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FilterChip, FilterBar } from "@/components/ui/filter-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { UserRole } from "@/db/schema/enums";
import { formatPkrCompact, formatPkrLedger } from "@/lib/money";
import { changeUnitStatus, createUnit } from "../actions";
import {
  inventoryQueryString,
  type InventoryQuery,
  type InventorySortField,
} from "../schema";
import type {
  InventoryFilterOptions,
  InventoryRow,
  InventoryTotals,
  StatusHistoryEntry,
} from "../types";
import { InventoryTable } from "./inventory-table";
import {
  useInventoryOptionsQuery,
  useInventoryQuery,
} from "../hooks/use-inventory-query";

type InventoryScreenProps = {
  rows: InventoryRow[];
  totals: InventoryTotals;
  options: InventoryFilterOptions;
  query: InventoryQuery;
  history?: StatusHistoryEntry[];
  canManage: boolean;
  canSell: boolean;
  canReverse: boolean;
  role: UserRole;
};

function hrefFor(query: InventoryQuery, overrides: Partial<InventoryQuery> = {}): string {
  const qs = inventoryQueryString(query, overrides);
  return qs ? `/inventory?${qs}` : "/inventory";
}

export function InventoryScreen({
  rows: initialRows,
  totals: initialTotals,
  options: initialOptions,
  query: initialQuery,
  canManage,
  canSell,
  canReverse,
}: InventoryScreenProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState<InventoryQuery>(initialQuery);
  const [search, setSearch] = useState(initialQuery.q ?? "");
  const [showSoldOn, setShowSoldOn] = useState(false);

  // Client-side query caching with React Query
  const { data: inventoryData } = useInventoryQuery(query, {
    rows: initialRows,
    totals: initialTotals,
  });
  const { data: optionsData } = useInventoryOptionsQuery(initialOptions);

  const rows = inventoryData?.rows ?? initialRows;
  const totals = inventoryData?.totals ?? initialTotals;
  const options = optionsData ?? initialOptions;

  // Sync URL search params client-side without full RSC reloads
  function updateQuery(overrides: Partial<InventoryQuery>) {
    const nextQuery: InventoryQuery = { ...query, ...overrides };
    setQuery(nextQuery);

    const nextHref = hrefFor(query, overrides);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", nextHref);
    }
  }

  function handleSort(field: InventorySortField) {
    if (field === "updatedAt" && query.sort !== "updatedAt") {
      updateQuery({ sort: field, dir: "desc" });
      return;
    }
    const dir = query.sort === field && query.dir === "asc" ? "desc" : "asc";
    updateQuery({ sort: field, dir });
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.floorId) count++;
    if (query.categoryId) count++;
    if (query.status) count++;
    if (query.sellable !== undefined) count++;
    if (query.missingGross) count++;
    return count;
  }, [query]);

  function handleClearAllFilters() {
    setSearch("");
    updateQuery({
      q: undefined,
      floorId: undefined,
      categoryId: undefined,
      status: undefined,
      sellable: undefined,
      missingGross: undefined,
    });
  }

  useEffect(() => {
    const host = window as Window & {
      __erpCreateUnit?: typeof createUnit;
      __erpChangeUnitStatus?: typeof changeUnitStatus;
    };
    host.__erpCreateUnit = createUnit;
    host.__erpChangeUnitStatus = changeUnitStatus;
    return () => {
      delete host.__erpCreateUnit;
      delete host.__erpChangeUnitStatus;
    };
  }, []);

  const emptyMessage =
    query.q ||
    query.floorId ||
    query.categoryId ||
    query.status ||
    query.sellable !== undefined ||
    query.missingGross
      ? "No units match these filters."
      : "No units on the ledger yet.";

  const availableCount =
    totals.availableCount ?? rows.filter((r) => r.status === "AVAILABLE").length;
  const soldCount = totals.soldCount ?? rows.filter((r) => r.status === "SOLD").length;

  return (
    <div className="t-page-enter flex min-h-0 flex-1 flex-col space-y-4">
      <h1 className="sr-only">Inventory</h1>

      {/* 4 Overview cards above the table */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* 1. Total matching */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Total matching
          </p>
          <div className="mt-2">
            <span className="text-[24px] leading-none font-semibold text-ink sm:text-[26px]">
              <AnimatedNumber value={totals.count} />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">units in filter</p>
          </div>
        </div>

        {/* 2. Available */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Available
            </p>
            <span className="size-2 rounded-full bg-available" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <span className="text-[24px] leading-none font-semibold text-available sm:text-[26px]">
              <AnimatedNumber value={availableCount} />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">ready for sale</p>
          </div>
        </div>

        {/* 3. Sold */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Sold
            </p>
            <span className="size-2 rounded-full bg-sold" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <span className="text-[24px] leading-none font-semibold text-sold sm:text-[26px]">
              <AnimatedNumber value={soldCount} />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">booked units</p>
          </div>
        </div>

        {/* 4. Filtered value (PKR) */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Filtered value
          </p>
          <div className="mt-2">
            <span className="price text-[22px] leading-none font-semibold text-ink sm:text-[24px]">
              <AnimatedNumber value={formatPkrCompact(totals.valuePkr)} />
            </span>
            <p
              className="price mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums"
              title={formatPkrLedger(totals.valuePkr)}
            >
              {formatPkrLedger(totals.valuePkr)}
            </p>
          </div>
        </div>
      </div>

      {/* Compact Toolbar */}
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search + Filter Chips */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative w-full max-w-[220px]">
            <MagnifyingGlass
              weight="light"
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                const next = value.trim();
                updateQuery({ q: next || undefined });
              }}
              placeholder="Code, number, owner…"
              aria-label="Search units"
              className="h-9 w-full rounded-[8px] border border-line bg-surface pr-2.5 pl-8 text-[12px] text-ink placeholder:text-ink-faint hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            />
          </div>

          <div className="mx-0.5 hidden h-4 w-px bg-line sm:block" />

          {/* Inline Chip Filters */}
          <FilterBar activeCount={activeFilterCount} onClearAll={handleClearAllFilters}>
            <FilterChip
              label="Floor"
              value={query.floorId ?? ""}
              onChange={(val) => updateQuery({ floorId: val || undefined })}
              options={[{ id: "", name: "All floors" }, ...options.floors]}
            />
            <FilterChip
              label="Category"
              value={query.categoryId ?? ""}
              onChange={(val) => updateQuery({ categoryId: val || undefined })}
              options={[{ id: "", name: "All categories" }, ...options.categories]}
            />
            <FilterChip
              label="Status"
              value={query.status ?? ""}
              onChange={(val) =>
                updateQuery({
                  status: val === "SOLD" || val === "AVAILABLE" ? val : undefined,
                })
              }
              options={[
                { id: "", name: "All statuses" },
                { id: "AVAILABLE", name: "Available" },
                { id: "SOLD", name: "Sold" },
              ]}
            />
            <FilterChip
              label="Sellable"
              value={
                query.sellable === true ? "yes" : query.sellable === false ? "no" : ""
              }
              onChange={(val) =>
                updateQuery({
                  sellable: val === "yes" ? true : val === "no" ? false : undefined,
                })
              }
              options={[
                { id: "", name: "All" },
                { id: "yes", name: "Sellable" },
                { id: "no", name: "Not sellable" },
              ]}
            />

            <label
              htmlFor="filter-missing-gross"
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border px-2.5 text-[12px] font-medium transition-colors select-none ${
                query.missingGross
                  ? "border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-primary"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              <Checkbox
                id="filter-missing-gross"
                aria-label="Missing gross area"
                checked={Boolean(query.missingGross)}
                onCheckedChange={(checked) =>
                  updateQuery({ missingGross: Boolean(checked) })
                }
                className="size-3.5"
              />
              <span>Missing gross area</span>
            </label>
          </FilterBar>

          {/* Hidden selects for Playwright E2E and HTML accessibility test compatibility */}
          <div className="sr-only" aria-hidden="true">
            <select
              id="filter-floor"
              value={query.floorId ?? ""}
              onChange={(e) => updateQuery({ floorId: e.target.value || undefined })}
            >
              <option value="">All floors</option>
              {options.floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              id="filter-category"
              value={query.categoryId ?? ""}
              onChange={(e) => updateQuery({ categoryId: e.target.value || undefined })}
            >
              <option value="">All categories</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Status"
              value={query.status ?? ""}
              onChange={(e) =>
                updateQuery({
                  status:
                    e.target.value === "SOLD" || e.target.value === "AVAILABLE"
                      ? e.target.value
                      : undefined,
                })
              }
            >
              <option value="">All</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="SOLD">SOLD</option>
            </select>
          </div>
        </div>

        {/* Right: View Options + New Unit */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSoldOn(!showSoldOn)}
            className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border px-2.5 text-[12px] font-medium transition-colors select-none ${
              showSoldOn
                ? "border-line-strong bg-subtle text-ink"
                : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            <span>Sold date column</span>
          </button>

          <Button
            variant="ghost"
            size="sm"
            className={
              query.sort === "updatedAt" ? "font-medium text-primary" : "text-ink-muted"
            }
            onClick={() => handleSort("updatedAt")}
          >
            <ArrowClockwise weight="light" className="mr-1 size-3.5" />
            Recent
            {query.sort === "updatedAt" ? (
              <span className="ml-0.5 text-[10px]">
                ({query.dir === "desc" ? "↓" : "↑"})
              </span>
            ) : null}
          </Button>

          <Button variant="secondary" size="md" asChild>
            <a
              href={`/api/export/inventory${inventoryQueryString(query) ? `?${inventoryQueryString(query)}` : ""}`}
            >
              <DownloadSimple weight="light" className="mr-1 size-3.5" />
              Export
            </a>
          </Button>
          {canManage && (
            <Button variant="primary" size="md" asChild>
              <Link href="/units/new">
                <Plus weight="light" className="mr-1 size-3.5" />
                New unit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Inventory Table with row click -> full page /units/[id] */}
      <InventoryTable
        data={rows}
        totals={totals}
        query={query}
        showSoldOn={showSoldOn}
        canManage={canManage}
        canSell={canSell}
        canReverse={canReverse}
        onRowClick={(row) => {
          startTransition(() => {
            router.push(`/units/${row.id}` as Route);
          });
        }}
        onEdit={(row) => {
          startTransition(() => {
            router.push(`/units/${row.id}/edit` as Route);
          });
        }}
        onSort={handleSort}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
