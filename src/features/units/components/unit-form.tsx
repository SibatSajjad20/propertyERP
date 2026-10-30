"use client";

import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGrossLessThanNet } from "@/lib/area";
import {
  computeTotalPrice,
  formatPkrCompact,
  formatPkrLedger,
  moneyEquals,
} from "@/lib/money";
import type { UserRole } from "@/db/schema/enums";
import {
  createUnitSchema,
  updateUnitSchema,
  type CreateUnitInput,
  type UnitFormValues,
  type UpdateUnitInput,
} from "../schema";
import type { InventoryFilterOptions, InventoryRow } from "../types";

const fieldClass =
  "h-8 w-full rounded-sm border border-line bg-surface px-2.5 text-[13px] text-ink";

type UnitFormProps = {
  mode: "create" | "edit";
  options: InventoryFilterOptions;
  role: UserRole;
  unit?: InventoryRow;
  error?: string | null;
  pending?: boolean;
  onSubmit: (values: CreateUnitInput | UpdateUnitInput) => Promise<void>;
  onCancel: () => void;
  onArchive?: () => Promise<void>;
};

function toDefaults(
  unit: InventoryRow | undefined,
  options: InventoryFilterOptions,
): UnitFormValues {
  if (unit) {
    return {
      unitCode: unit.unitCode,
      unitNumber: unit.unitNumber,
      floorId: unit.floorId,
      categoryId: unit.categoryId,
      netAreaSqft: unit.netAreaSqft,
      grossAreaSqft: unit.grossAreaSqft ?? "",
      ratePerSqftPkr: unit.ratePerSqftPkr,
      priceAdjustmentPkr: unit.priceAdjustmentPkr,
      priceAdjustmentReason: unit.priceAdjustmentReason ?? "",
      isSellable: unit.isSellable,
      ownershipGroup: unit.ownershipGroup ?? "",
      subOwner: unit.subOwner ?? "",
      bookingRef: unit.bookingRef ?? "",
      notes: unit.notes ?? "",
      rateChangeReason: "",
    };
  }
  const firstFloor = options.floors[0]?.id ?? "";
  const firstCategory = options.categories[0];
  return {
    unitCode: "",
    unitNumber: "",
    floorId: firstFloor,
    categoryId: firstCategory?.id ?? "",
    netAreaSqft: "",
    grossAreaSqft: "",
    ratePerSqftPkr: "",
    priceAdjustmentPkr: "0",
    priceAdjustmentReason: "",
    isSellable: firstCategory?.isSellableDefault ?? true,
    ownershipGroup: "",
    subOwner: "",
    bookingRef: "",
    notes: "",
    rateChangeReason: "",
  };
}

export function UnitForm({
  mode,
  options,
  role,
  unit,
  error,
  pending,
  onSubmit,
  onCancel,
  onArchive,
}: UnitFormProps) {
  const form = useForm<UnitFormValues>({
    defaultValues: toDefaults(unit, options),
  });

  const soldLocked = unit?.status === "SOLD" && role !== "ADMIN";
  // eslint-disable-next-line react-hooks/incompatible-library -- live total from RHF fields
  const rate = form.watch("ratePerSqftPkr");
  const net = form.watch("netAreaSqft");
  const adjustment = form.watch("priceAdjustmentPkr") ?? "0";
  const gross = form.watch("grossAreaSqft");
  const rateChanged =
    mode === "edit" && unit ? !moneyEquals(unit.ratePerSqftPkr, rate || "0") : false;

  let liveTotal: string | null = null;
  try {
    if (rate && net) {
      liveTotal = computeTotalPrice(rate, net, adjustment || "0");
    }
  } catch {
    liveTotal = null;
  }

  const grossWarning =
    typeof gross === "string" && net ? isGrossLessThanNet(gross, net) : false;

  async function handleSubmit(values: UnitFormValues) {
    try {
      if (mode === "create") {
        await onSubmit(createUnitSchema.parse(values));
        return;
      }
      await onSubmit(
        updateUnitSchema.parse({
          ...values,
          id: unit?.id,
          version: unit?.version,
        }),
      );
    } catch (caught) {
      if (caught instanceof ZodError) {
        for (const issue of caught.issues) {
          const path = issue.path[0];
          if (typeof path === "string") {
            form.setError(path as keyof UnitFormValues, { message: issue.message });
          }
        }
        return;
      }
      throw caught;
    }
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => void form.handleSubmit(handleSubmit)(event)}
    >
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        <Field
          label="Unit code"
          error={form.formState.errors.unitCode?.message}
          htmlFor="unit-code"
        >
          <Input
            id="unit-code"
            className="unit-code uppercase"
            autoComplete="off"
            {...form.register("unitCode", {
              onChange: (event) => {
                event.target.value = event.target.value.toUpperCase();
              },
            })}
          />
        </Field>
        <Field
          label="Unit number"
          error={form.formState.errors.unitNumber?.message}
          htmlFor="unit-number"
        >
          <Input id="unit-number" autoComplete="off" {...form.register("unitNumber")} />
        </Field>
        <Field
          label="Floor"
          error={form.formState.errors.floorId?.message}
          htmlFor="unit-floor"
        >
          <select id="unit-floor" className={fieldClass} {...form.register("floorId")}>
            {options.floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Category"
          error={form.formState.errors.categoryId?.message}
          htmlFor="unit-category"
        >
          <select
            id="unit-category"
            className={fieldClass}
            {...form.register("categoryId", {
              onChange: (event) => {
                if (mode === "edit") {
                  return;
                }
                const selected = options.categories.find(
                  (item) => item.id === event.target.value,
                );
                if (selected) {
                  form.setValue("isSellable", selected.isSellableDefault);
                }
              },
            })}
          >
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Net area (sq ft)"
          error={form.formState.errors.netAreaSqft?.message}
          htmlFor="unit-net"
        >
          <Input
            id="unit-net"
            className="tabular-nums"
            inputMode="decimal"
            disabled={soldLocked}
            {...form.register("netAreaSqft")}
          />
        </Field>
        <Field
          label="Gross area (sq ft)"
          error={form.formState.errors.grossAreaSqft?.message}
          htmlFor="unit-gross"
        >
          <Input
            id="unit-gross"
            className="tabular-nums"
            inputMode="decimal"
            disabled={soldLocked}
            {...form.register("grossAreaSqft")}
          />
          {grossWarning ? (
            <p className="text-[12px] text-accent">
              Gross area is smaller than net area.
            </p>
          ) : null}
        </Field>
        <Field
          label="Rate per sq ft (PKR)"
          error={form.formState.errors.ratePerSqftPkr?.message}
          htmlFor="unit-rate"
        >
          <Input
            id="unit-rate"
            className="tabular-nums"
            inputMode="decimal"
            disabled={soldLocked}
            {...form.register("ratePerSqftPkr")}
          />
        </Field>
        {rateChanged ? (
          <Field
            label="Rate change reason"
            error={form.formState.errors.rateChangeReason?.message}
            htmlFor="unit-rate-reason"
          >
            <Input id="unit-rate-reason" {...form.register("rateChangeReason")} />
          </Field>
        ) : null}
        <Field
          label="Price adjustment (PKR)"
          error={form.formState.errors.priceAdjustmentPkr?.message}
          htmlFor="unit-adj"
        >
          <Input
            id="unit-adj"
            className="tabular-nums"
            inputMode="decimal"
            disabled={soldLocked}
            {...form.register("priceAdjustmentPkr")}
          />
        </Field>
        <Field
          label="Adjustment reason"
          error={form.formState.errors.priceAdjustmentReason?.message}
          htmlFor="unit-adj-reason"
        >
          <Input
            id="unit-adj-reason"
            disabled={soldLocked}
            {...form.register("priceAdjustmentReason")}
          />
        </Field>
        <div className="border-b border-line py-2">
          <p className="text-[11px] tracking-wide text-ink-muted">Computed total</p>
          <p className="font-display text-[22px] text-ink tabular-nums">
            {liveTotal ? formatPkrLedger(liveTotal) : "—"}
          </p>
          {liveTotal ? (
            <p className="text-[12px] text-ink-muted">{formatPkrCompact(liveTotal)}</p>
          ) : null}
        </div>
        <label className="flex h-8 items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            {...form.register("isSellable")}
          />
          Sellable
        </label>
        <Field label="Ownership group" htmlFor="unit-owner">
          <Input id="unit-owner" {...form.register("ownershipGroup")} />
        </Field>
        <Field label="Sub-owner" htmlFor="unit-sub">
          <Input id="unit-sub" {...form.register("subOwner")} />
        </Field>
        <Field label="Booking ref" htmlFor="unit-booking">
          <Input id="unit-booking" {...form.register("bookingRef")} />
        </Field>
        <Field label="Notes" htmlFor="unit-notes">
          <textarea
            id="unit-notes"
            rows={3}
            className="w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink"
            {...form.register("notes")}
          />
        </Field>
        {soldLocked ? (
          <p className="text-[12px] text-ink-muted">
            Rate, area, and adjustment are locked on sold units.
          </p>
        ) : null}
        {error ? (
          <p className="text-[12px] text-sold" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
        {mode === "edit" && onArchive ? (
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => void onArchive()}
          >
            Archive
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save unit"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[12px] text-sold" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
