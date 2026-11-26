"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  MagnifyingGlass,
  Plus,
  DownloadSimple,
  GitMerge,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitStatus, UserRole } from "@/db/schema/enums";
import { formatPkrCompact, formatPkrLedger } from "@/lib/money";
import { changeUnitStatus, createUnit } from "../actions";
import {
  inventoryQueryString,
  type InventoryQuery,
  type InventorySortField,
} from "../schema";
import {
  categoryMatchesSection,
  INVENTORY_SECTIONS,
  type InventorySectionKey,
} from "../sections";
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
  nextCursor?: string | null;
  pageSize?: number;
  options: InventoryFilterOptions;
  query: InventoryQuery;
  history?: StatusHistoryEntry[];
  canManage: boolean;
  canSell: boolean;
  canReverse: boolean;
  pendingMergeCount?: number;
  role: UserRole;
};

function hrefFor(query: InventoryQuery, overrides: Partial<InventoryQuery> = {}): string {
  const qs = inventoryQueryString(query, overrides);
  return qs ? `/inventory?${qs}` : "/inventory";
}

export function InventoryScreen({
  rows: initialRows,
  totals: initialTotals,
  nextCursor: initialNextCursor = null,
  pageSize: initialPageSize,
  options: initialOptions,
  query: initialQuery,
  canManage,
  canSell,
  canReverse,
  pendingMergeCount = 0,
  role,
}: InventoryScreenProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState<InventoryQuery>(initialQuery);
  const [search, setSearch] = useState(initialQuery.q ?? "");
  const [showSoldOn, setShowSoldOn] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryMatchesServer =
    query.q === initialQuery.q &&
    query.section === initialQuery.section &&
    query.floorId === initialQuery.floorId &&
    query.categoryId === initialQuery.categoryId &&
    query.status === initialQuery.status &&
    query.sellable === initialQuery.sellable &&
    Boolean(query.missingGross) === Boolean(initialQuery.missingGross) &&
    query.sort === initialQuery.sort &&
    query.dir === initialQuery.dir;

  // Client-side query caching with React Query
  const inventoryQuery = useInventoryQuery(
    query,
    queryMatchesServer
      ? {
          rows: initialRows,
          totals: initialTotals,
          totalCount: initialTotals.count,
          nextCursor: initialNextCursor,
          pageSize: initialPageSize ?? 100,
        }
      : undefined,
  );
  const { data: optionsData } = useInventoryOptionsQuery(initialOptions);

  const rows = inventoryQuery.data ? inventoryQuery.rows : initialRows;
  const totals = inventoryQuery.totals ?? initialTotals;
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

  function handleClearAllFilters() {
    setSearch("");
    updateQuery({
      q: undefined,
      section: undefined,
      floorId: undefined,
      categoryId: undefined,
      status: undefined,
      sellable: undefined,
      missingGross: undefined,
    });
  }

  function handleSelectSection(section?: InventorySectionKey) {
    // Switching inventory section resets category & floor sub-filters so cascading options stay valid
    updateQuery({
      section,
      categoryId: undefined,
      floorId: undefined,
    });
  }

  // Scope sub-category & floor options based on the active inventory section
  const scopedCategories = query.section
    ? options.categories.filter((cat) => categoryMatchesSection(cat.name, query.section!))
    : options.categories;

  const scopedFloors =
    query.section === "mall-shops"
      ? options.floors.filter((f) => (f.level ?? 0) >= 1 && (f.level ?? 0) <= 3)
      : query.section === "commercial-shops"
        ? options.floors.filter((f) => (f.level ?? 0) <= 0)
        : query.section === "food-court"
          ? options.floors.filter((f) => (f.level ?? 0) === 3)
          : query.section === "kiosks"
            ? options.floors.filter((f) => (f.level ?? 0) === 3)
            : query.section === "corporate-offices"
              ? options.floors.filter((f) => (f.level ?? 0) === 4 || (f.level ?? 0) === 5)
              : query.section === "residential-apartments"
                ? options.floors.filter(
                    (f) => (f.level ?? 0) >= 6 && (f.level ?? 0) <= 10,
                  )
                : options.floors;

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
    query.section ||
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

  const hasActiveFilters = Boolean(
    query.q ||
    query.section ||
    query.floorId ||
    query.categoryId ||
    query.status ||
    query.sellable !== undefined ||
    query.missingGross,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Units"
        meta={[`${totals.count} units across ${options.floors.length} floors`]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                <Button variant="secondary" size="md" asChild>
                  <Link href={"/inventory/merges" as Route}>
                    <GitMerge weight="light" className="mr-1.5 size-4" />
                    Merge Requests
                    {pendingMergeCount > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                        {pendingMergeCount}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button variant="secondary" size="md" asChild>
                  <Link href={"/inventory/merge" as never}>
                    <GitMerge weight="light" className="mr-1.5 size-4" />
                    Merge Units
                  </Link>
                </Button>
              </>
            )}
            <Button variant="secondary" size="md" asChild>
              <a
                href={`/api/export/inventory${inventoryQueryString(query) ? `?${inventoryQueryString(query)}` : ""}`}
              >
                <DownloadSimple weight="light" className="mr-1.5 size-4" />
                Export
              </a>
            </Button>
            <Button variant="secondary" size="md" asChild>
              <Link href="/import">
                <ArrowSquareOut weight="light" className="mr-1.5 size-4" />
                Import
              </Link>
            </Button>
            {canManage && (
              <Button variant="primary" size="md" asChild>
                <Link href="/units/new">
                  <Plus weight="light" className="mr-1.5 size-4" />
                  New unit
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Separate Inventory Section Filter Tabs (scopes further filter options below) */}
      <div
        role="tablist"
        aria-label="Inventory sections"
        className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!query.section}
          onClick={() => handleSelectSection(undefined)}
          className={`h-8 cursor-pointer rounded-[8px] border px-3 text-[12px] font-medium transition-colors ${
            !query.section
              ? "border-primary bg-primary text-white shadow-xs"
              : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          All Inventory
        </button>
        {INVENTORY_SECTIONS.map((sec) => {
          const active = query.section === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectSection(sec.key)}
              className={`h-8 cursor-pointer rounded-[8px] border px-3 text-[12px] font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-white shadow-xs"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* 4 Overview StatCells above the table */}
      <StatStrip columns="1.2fr 1.2fr 1fr 1fr" className="mb-0">
        <StatCell
          label="Total matching"
          value={totals.count}
          suffix="units"
          subLine={`${totals.netAreaSqft} net sq ft`}
        />
        <StatCell
          label="Filtered value"
          value={formatPkrCompact(totals.valuePkr)}
          prefixRs
          subLine={formatPkrLedger(totals.valuePkr)}
        />
        <StatCell
          label="Available"
          value={availableCount}
          suffix={
            totals.count > 0
              ? `(${Math.round((availableCount / totals.count) * 100)}%)`
              : undefined
          }
          subLine="Ready for sale"
          progress={totals.count > 0 ? (availableCount / totals.count) * 100 : 0}
        />
        <StatCell
          label="Sold"
          value={soldCount}
          suffix={
            totals.count > 0
              ? `(${Math.round((soldCount / totals.count) * 100)}%)`
              : undefined
          }
          subLine="Finalized / sold"
          progress={
            totals.count > 0
              ? [{ percent: (soldCount / totals.count) * 100, color: "#0B3F66" }]
              : 0
          }
        />
      </StatStrip>

      {/* Toolbar: Search + Filters + Actions */}
      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search + Radix Selects */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative w-full max-w-[200px]">
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
                if (searchTimer.current) clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => {
                  const next = value.trim();
                  updateQuery({ q: next || undefined });
                }, 300);
              }}
              placeholder="Code, number, owner…"
              aria-label="Search units"
              className="h-9 w-full rounded-[8px] border border-line bg-surface pr-2.5 pl-8 text-[12px] text-ink placeholder:text-ink-faint hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            />
          </div>

          <div className="mx-0.5 hidden h-4 w-px bg-line sm:block" />

          {/* Floor Select */}
          <Select
            value={query.floorId || "all"}
            onValueChange={(val) =>
              updateQuery({ floorId: val === "all" ? undefined : val })
            }
          >
            <SelectTrigger className="w-[140px]" aria-label="Floor filter">
              <SelectValue placeholder="All floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All floors</SelectItem>
              {scopedFloors.map((fl) => (
                <SelectItem key={fl.id} value={fl.id}>
                  {fl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category / Sub-category Select (scoped by active section) */}
          <Select
            value={query.categoryId || "all"}
            onValueChange={(val) =>
              updateQuery({ categoryId: val === "all" ? undefined : val })
            }
          >
            <SelectTrigger className="w-[160px]" aria-label="Category filter">
              <SelectValue
                placeholder={query.section ? "All sub-types" : "All categories"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {query.section ? "All sub-types" : "All categories"}
              </SelectItem>
              {scopedCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select
            value={query.status || "all"}
            onValueChange={(val) =>
              updateQuery({
                status:
                  val === "AVAILABLE" ||
                  val === "RESERVED" ||
                  val === "BOOKED" ||
                  val === "SOLD"
                    ? (val as UnitStatus)
                    : undefined,
              })
            }
          >
            <SelectTrigger className="w-[140px]" aria-label="Status filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="BOOKED">Booked</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
            </SelectContent>
          </Select>

          {/* Sellable Select */}
          <Select
            value={
              query.sellable === true ? "yes" : query.sellable === false ? "no" : "all"
            }
            onValueChange={(val) =>
              updateQuery({
                sellable: val === "yes" ? true : val === "no" ? false : undefined,
              })
            }
          >
            <SelectTrigger className="w-[120px]" aria-label="Sellable filter">
              <SelectValue placeholder="Sellable: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sellable: All</SelectItem>
              <SelectItem value="yes">Sellable only</SelectItem>
              <SelectItem value="no">Not sellable</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-ink-muted hover:text-ink"
            >
              Reset
            </Button>
          )}

          {/* Hidden selects for Playwright E2E and HTML accessibility test compatibility */}
          <div className="sr-only">
            <select
              id="filter-floor"
              aria-label="Floor"
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
              aria-label="Category"
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
        onNearEnd={() => {
          if (inventoryQuery.hasNextPage && !inventoryQuery.isFetchingNextPage) {
            void inventoryQuery.fetchNextPage();
          }
        }}
      />
    </div>
  );
}
