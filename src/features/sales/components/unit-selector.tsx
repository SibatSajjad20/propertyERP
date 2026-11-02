/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { CheckCircle, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { cn } from "@/lib/cn";
import { UnitStatusBadge } from "@/components/ui/unit-status-badge";

export interface SelectableUnit {
  id: string;
  unitCode: string;
  unitNumber: string;
  floorId: string;
  floorName: string;
  floorLevel: number;
  blockId: string;
  blockName: string;
  categoryId: string;
  categoryName: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  computedPricePkr: string | null;
  status: string;
  version: number;
}

interface UnitSelectorProps {
  units: SelectableUnit[];
  selectedUnitId?: string;
  onSelectUnit: (unit: SelectableUnit) => void;
  floors?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
}

export function UnitSelector({
  units,
  selectedUnitId,
  onSelectUnit,
  floors = [],
  categories = [],
}: UnitSelectorProps) {
  const [selectedFloor, setSelectedFloor] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const filteredUnits = React.useMemo(() => {
    return units.filter((u) => {
      if (selectedFloor !== "all" && u.floorId !== selectedFloor) return false;
      if (selectedCategory !== "all" && u.categoryId !== selectedCategory) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        return (
          u.unitCode.toLowerCase().includes(term) ||
          u.unitNumber.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [units, selectedFloor, selectedCategory, search]);

  return (
    <div className="space-y-4">
      {/* Filter Row: Floor, Category, Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-[180px]">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger>
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlass
            weight="light"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit code or number…"
            className="h-9 w-full rounded-[8px] border border-line bg-surface pr-3 pl-8 text-[13px] text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </div>
      </div>

      {/* Selectable Unit Cards */}
      {filteredUnits.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <p className="text-[14px] font-medium text-ink">No units available</p>
          <p className="mt-1 text-[12px] text-ink-muted">
            Try choosing a different floor or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((unit) => {
            const isSelected = unit.id === selectedUnitId;
            const fullPrice = unit.computedPricePkr || "0.00";

            return (
              <div
                key={unit.id}
                onClick={() => onSelectUnit(unit)}
                className={cn(
                  "card group relative cursor-pointer p-4 transition-all duration-150 select-none",
                  isSelected
                    ? "border-primary bg-[color-mix(in_srgb,var(--primary)_4%,white)] ring-2 ring-primary/20"
                    : "hover:-translate-y-0.5 hover:border-line-strong",
                )}
              >
                {/* Header row: code + radio / check */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="unit-code font-mono text-[15px] font-bold tracking-tight text-ink">
                      {unit.unitCode}
                    </span>
                    <p className="text-[12px] text-ink-muted">
                      {unit.floorName} · {unit.categoryName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UnitStatusBadge status={unit.status} />
                    {isSelected && (
                      <CheckCircle weight="fill" className="size-5 text-primary" />
                    )}
                  </div>
                </div>

                {/* Specs row */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-line/60 pt-2.5 text-[12px]">
                  <div>
                    <span className="text-ink-muted">Net Area:</span>
                    <p className="font-medium text-ink tabular-nums">
                      {unit.netAreaSqft} sq ft
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Rate / sq ft:</span>
                    <p className="font-medium text-ink tabular-nums">
                      {formatPkr(unit.ratePerSqftPkr)}
                    </p>
                  </div>
                </div>

                {/* Full price banner */}
                <div className="mt-3 flex items-center justify-between rounded-[6px] bg-subtle/80 px-2.5 py-1.5">
                  <span className="text-[11px] font-medium text-ink-muted uppercase">
                    Asking Price
                  </span>
                  <span className="font-sans text-[13px] font-semibold text-ink tabular-nums">
                    {formatPkr(fullPrice)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
