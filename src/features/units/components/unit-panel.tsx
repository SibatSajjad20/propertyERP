"use client";

import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { UserRole } from "@/db/schema/enums";
import type { CreateUnitInput, UpdateUnitInput } from "../schema";
import type { InventoryFilterOptions, InventoryRow, StatusHistoryEntry } from "../types";
import { UnitForm } from "./unit-form";
import { UnitRead } from "./unit-read";
import { UnitStatusActions } from "./unit-status-actions";

export type UnitPanelMode = "view" | "edit" | "create";

interface UnitPanelProps {
  open: boolean;
  mode: UnitPanelMode;
  unit: InventoryRow | null;
  options: InventoryFilterOptions;
  role: UserRole;
  canManage: boolean;
  canSell: boolean;
  canReverse: boolean;
  history?: StatusHistoryEntry[];
  error?: string | null;
  pending?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSubmit: (values: CreateUnitInput | UpdateUnitInput) => Promise<void>;
  onArchive?: () => Promise<void>;
}

function titleFor(mode: UnitPanelMode, unit: InventoryRow | null): string {
  if (mode === "create") {
    return "New unit";
  }
  if (mode === "edit") {
    return unit ? `Edit ${unit.unitCode}` : "Edit unit";
  }
  return unit?.unitCode ?? "Unit";
}

export function UnitPanel({
  open,
  mode,
  unit,
  options,
  role,
  canManage,
  canSell,
  canReverse,
  history = [],
  error,
  pending,
  onClose,
  onEdit,
  onSubmit,
  onArchive,
}: UnitPanelProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent widthClass="w-full max-w-[480px]">
        {/* Header */}
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{titleFor(mode, unit)}</SheetTitle>
            {mode === "view" && unit && (
              <span className="font-mono text-[11px] text-ink-muted">
                #{unit.unitNumber}
              </span>
            )}
          </div>
          <div className="mr-6 flex items-center gap-2">
            {mode === "view" && canManage && unit ? (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <PencilSimple weight="light" className="mr-1 size-3.5" />
                Edit
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {/* Content body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {mode === "view" && unit ? (
            <UnitStatusActions
              key={unit.id}
              unit={unit}
              canSell={canSell}
              canReverse={canReverse}
            >
              <UnitRead unit={unit} history={history} />
            </UnitStatusActions>
          ) : null}

          {mode === "create" ? (
            <UnitForm
              key="create"
              mode="create"
              options={options}
              role={role}
              error={error}
              pending={pending}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          ) : null}

          {mode === "edit" && unit ? (
            <UnitForm
              key={unit.id}
              mode="edit"
              options={options}
              role={role}
              unit={unit}
              error={error}
              pending={pending}
              onSubmit={onSubmit}
              onCancel={onClose}
              onArchive={onArchive}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
