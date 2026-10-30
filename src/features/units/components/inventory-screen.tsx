"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/db/schema/enums";
import { errorMessage } from "@/lib/errors";
import { archiveUnit, createUnit, updateUnit } from "../actions";
import {
  inventoryQueryString,
  type CreateUnitInput,
  type InventoryQuery,
  type InventorySortField,
  type UpdateUnitInput,
} from "../schema";
import type { InventoryFilterOptions, InventoryRow, InventoryTotals } from "../types";
import { InventoryTable } from "./inventory-table";
import { UnitPanel, type UnitPanelMode } from "./unit-panel";

const selectClass =
  "h-8 min-w-[140px] rounded-sm border border-line bg-surface px-2.5 text-[13px] text-ink";

type InventoryScreenProps = {
  rows: InventoryRow[];
  totals: InventoryTotals;
  options: InventoryFilterOptions;
  query: InventoryQuery;
  canManage: boolean;
  role: UserRole;
};

function hrefFor(query: InventoryQuery, overrides: Partial<InventoryQuery> = {}): Route {
  const qs = inventoryQueryString(query, overrides);
  return (qs ? `/inventory?${qs}` : "/inventory") as Route;
}

export function InventoryScreen({
  rows,
  totals,
  options,
  query,
  canManage,
  role,
}: InventoryScreenProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query.q ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => rows.find((row) => row.id === query.unitId) ?? null,
    [query.unitId, rows],
  );

  const panelOpen = query.mode === "create" || Boolean(query.unitId);
  const panelMode: UnitPanelMode =
    query.mode === "create"
      ? "create"
      : query.mode === "edit" && selected
        ? "edit"
        : "view";

  function push(overrides: Partial<InventoryQuery>) {
    router.push(hrefFor(query, overrides));
  }

  function handleSort(field: InventorySortField) {
    const dir = query.sort === field && query.dir === "asc" ? "desc" : "asc";
    push({ sort: field, dir });
  }

  async function run(task: () => Promise<unknown>, after?: Partial<InventoryQuery>) {
    setPending(true);
    setError(null);
    try {
      await task();
      setPending(false);
      router.push(hrefFor(query, after ?? { mode: "view" }));
      router.refresh();
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
      setPending(false);
      throw caught;
    }
  }

  async function handleSubmit(values: CreateUnitInput | UpdateUnitInput): Promise<void> {
    if (query.mode === "create" || !("id" in values)) {
      setPending(true);
      setError(null);
      try {
        const row = await createUnit(values);
        setPending(false);
        router.push(hrefFor(query, { unitId: row.id, mode: "view" }));
        router.refresh();
      } catch (caught) {
        const message = errorMessage(caught);
        setError(message);
        toast.error(message);
        setPending(false);
        throw caught;
      }
      return;
    }
    await run(() => updateUnit(values), { unitId: values.id, mode: "view" });
  }

  async function handleArchive() {
    if (!selected) {
      return;
    }
    await run(() => archiveUnit({ id: selected.id, version: selected.version }), {
      unitId: undefined,
      mode: "view",
    });
  }

  useEffect(() => {
    const host = window as Window & { __erpCreateUnit?: typeof createUnit };
    host.__erpCreateUnit = createUnit;
    return () => {
      delete host.__erpCreateUnit;
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-end gap-2 border-b border-line pb-3">
        <div className="min-w-[180px] flex-1 space-y-1">
          <p className="text-[11px] font-medium tracking-wide text-ink-muted">Search</p>
          <Input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              const next = value.trim();
              if ((query.q ?? "") === next) {
                return;
              }
              router.push(hrefFor(query, { q: next || undefined }));
            }}
            placeholder="Code, number, owner"
            aria-label="Search units"
          />
        </div>
        <FilterSelect
          label="Floor"
          value={query.floorId ?? ""}
          onChange={(value) => push({ floorId: value || undefined })}
          options={[{ id: "", name: "All floors" }, ...options.floors]}
        />
        <FilterSelect
          label="Category"
          value={query.categoryId ?? ""}
          onChange={(value) => push({ categoryId: value || undefined })}
          options={[{ id: "", name: "All categories" }, ...options.categories]}
        />
        <FilterSelect
          label="Status"
          value={query.status ?? ""}
          onChange={(value) =>
            push({
              status: value === "SOLD" || value === "AVAILABLE" ? value : undefined,
            })
          }
          options={[
            { id: "", name: "All statuses" },
            { id: "AVAILABLE", name: "Available" },
            { id: "SOLD", name: "Sold" },
          ]}
        />
        <FilterSelect
          label="Sellable"
          value={query.sellable === true ? "yes" : query.sellable === false ? "no" : ""}
          onChange={(value) =>
            push({
              sellable: value === "yes" ? true : value === "no" ? false : undefined,
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
          className="flex h-8 items-center gap-2 text-[13px]"
        >
          <input
            id="filter-missing-gross"
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={query.missingGross}
            onChange={(event) => push({ missingGross: event.target.checked })}
          />
          Missing gross area
        </label>
        <div className="ml-auto flex gap-2">
          {canManage ? (
            <Button onClick={() => push({ mode: "create", unitId: undefined })}>
              New unit
            </Button>
          ) : null}
        </div>
      </div>

      <InventoryTable
        data={rows}
        totals={totals}
        query={query}
        selectedId={selected?.id}
        onRowClick={(row) => push({ unitId: row.id, mode: "view" })}
        onSort={handleSort}
        emptyMessage={emptyMessage}
      />

      <UnitPanel
        open={panelOpen}
        mode={panelMode}
        unit={selected}
        options={options}
        role={role}
        canManage={canManage}
        error={error}
        pending={pending}
        onClose={() => push({ unitId: undefined, mode: "view" })}
        onEdit={() => selected && push({ unitId: selected.id, mode: "edit" })}
        onSubmit={handleSubmit}
        onArchive={selected ? handleArchive : undefined}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
}) {
  const selectId = `filter-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="space-y-1">
      <label
        htmlFor={selectId}
        className="text-[11px] font-medium tracking-wide text-ink-muted"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id || "all"} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
