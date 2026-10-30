"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/db/schema/enums";
import type { CreateUnitInput, UpdateUnitInput } from "../schema";
import type { InventoryFilterOptions, InventoryRow } from "../types";
import { UnitForm } from "./unit-form";
import { UnitRead } from "./unit-read";

export type UnitPanelMode = "view" | "edit" | "create";

type UnitPanelProps = {
  open: boolean;
  mode: UnitPanelMode;
  unit: InventoryRow | null;
  options: InventoryFilterOptions;
  role: UserRole;
  canManage: boolean;
  error?: string | null;
  pending?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSubmit: (values: CreateUnitInput | UpdateUnitInput) => Promise<void>;
  onArchive?: () => Promise<void>;
};

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
  error,
  pending,
  onClose,
  onEdit,
  onSubmit,
  onArchive,
}: UnitPanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--ink)_24%,transparent)] duration-[var(--duration)] ease-[var(--ease-ledger)]" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,400px)] flex-col border-l border-line bg-surface duration-[var(--duration)] ease-[var(--ease-ledger)]"
          aria-describedby={undefined}
        >
          <div className="flex h-[var(--topbar-height)] items-center justify-between border-b border-line px-4">
            <Dialog.Title className="font-display text-[18px] text-ink">
              {titleFor(mode, unit)}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {mode === "view" && canManage && unit ? (
                <Button variant="outline" onClick={onEdit}>
                  Edit
                </Button>
              ) : null}
              <Dialog.Close asChild>
                <Button variant="ghost">Close</Button>
              </Dialog.Close>
            </div>
          </div>
          {mode === "view" && unit ? <UnitRead unit={unit} /> : null}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
