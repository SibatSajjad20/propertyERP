"use client";

import * as React from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DownloadSimple, FileCsv, FileXls } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardFilterOptions } from "../queries";

interface DashboardFiltersProps {
  options: DashboardFilterOptions;
  selectedPropertyId?: string;
  selectedBlockId?: string;
}

export function DashboardFilters({
  options,
  selectedPropertyId,
  selectedBlockId,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter blocks by selected property if applicable
  const availableBlocks = React.useMemo(() => {
    if (!selectedPropertyId) return options.blocks;
    return options.blocks.filter((b) => b.propertyId === selectedPropertyId);
  }, [options.blocks, selectedPropertyId]);

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (!val || val === "all") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    const qs = params.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as Route, { scroll: false });
  }

  function handlePropertyChange(val: string) {
    if (val === "all") {
      updateQuery({ propertyId: null, blockId: null });
    } else {
      // If active block doesn't belong to the newly selected property, clear block
      const blockStillValid = options.blocks.some(
        (b) => b.id === selectedBlockId && b.propertyId === val,
      );
      updateQuery({
        propertyId: val,
        blockId: blockStillValid ? (selectedBlockId ?? null) : null,
      });
    }
  }

  function handleBlockChange(val: string) {
    if (val === "all") {
      updateQuery({ blockId: null });
    } else {
      updateQuery({ blockId: val });
    }
  }

  function getExportUrl(type: "inventory" | "sold" | "floors", format: "xlsx" | "csv") {
    const params = new URLSearchParams();
    params.set("type", type);
    params.set("format", format);
    if (selectedPropertyId) params.set("propertyId", selectedPropertyId);
    if (selectedBlockId) params.set("blockId", selectedBlockId);
    return `/api/export?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Property Select */}
      {options.properties.length > 1 && (
        <div className="w-40 sm:w-44">
          <Select
            value={selectedPropertyId || "all"}
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger size="sm" aria-label="Filter property">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {options.properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Block Select */}
      {options.blocks.length > 0 && (
        <div className="w-36 sm:w-40">
          <Select value={selectedBlockId || "all"} onValueChange={handleBlockChange}>
            <SelectTrigger size="sm" aria-label="Filter block">
              <SelectValue placeholder="All blocks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All blocks</SelectItem>
              {availableBlocks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1.5 text-[12px]">
            <DownloadSimple weight="light" className="size-3.5" />
            <span>Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
            Reports (.xlsx & .csv)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a
              href={getExportUrl("inventory", "xlsx")}
              download
              className="flex cursor-pointer items-center gap-2"
            >
              <FileXls weight="light" className="size-4 text-primary" />
              <span>Inventory (.xlsx)</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getExportUrl("inventory", "csv")}
              download
              className="flex cursor-pointer items-center gap-2"
            >
              <FileCsv weight="light" className="size-4 text-ink-muted" />
              <span>Inventory (.csv)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a
              href={getExportUrl("sold", "xlsx")}
              download
              className="flex cursor-pointer items-center gap-2"
            >
              <FileXls weight="light" className="size-4 text-sold" />
              <span>Sold Units (.xlsx)</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getExportUrl("sold", "csv")}
              download
              className="flex cursor-pointer items-center gap-2"
            >
              <FileCsv weight="light" className="size-4 text-ink-muted" />
              <span>Sold Units (.csv)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a
              href={getExportUrl("floors", "xlsx")}
              download
              className="flex cursor-pointer items-center gap-2"
            >
              <FileXls weight="light" className="size-4 text-available" />
              <span>Floor Summary (.xlsx)</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getExportUrl("floors", "csv")}
              download
              className="flex cursor-pointer items-center gap-2"
            >
              <FileCsv weight="light" className="size-4 text-ink-muted" />
              <span>Floor Summary (.csv)</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
