"use client";

import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { CaretUpDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

const selectWrapperClass =
  "relative flex w-full items-center rounded-[6px] border border-line bg-surface transition-colors hover:border-line-strong focus-within:border-line-strong focus-within:outline-2 focus-within:outline-[var(--focus-ring)]";
const selectInnerClass =
  "h-8 w-full appearance-none bg-transparent px-2.5 text-[13px] text-ink outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 pr-8";

interface UnitFormProps {
  mode: "create" | "edit";
  options: InventoryFilterOptions;
  role: UserRole;
  unit?: InventoryRow;
  error?: string | null;
  pending?: boolean;
  onSubmit: (values: CreateUnitInput | UpdateUnitInput) => Promise<void>;
  onCancel: () => void;
  onArchive?: () => Promise<void>;
}

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
  const isSellable = form.watch("isSellable");

  const rateChanged =
    mode === "edit" && unit ? !moneyEquals(unit.ratePerSqftPkr, rate || "0") : false;

  let liveBase: string | null = null;
  let liveTotal: string | null = null;
  try {
    if (rate && net) {
      liveBase = computeTotalPrice(rate, net, "0");
      liveTotal = computeTotalPrice(rate, net, adjustment || "0");
    }
  } catch {
    liveBase = null;
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
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        {/* SECTION 1: IDENTITY */}
        <section className="space-y-3">
          <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            Identity
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Unit code"
              error={form.formState.errors.unitCode?.message}
              htmlFor="unit-code"
            >
              <Input
                id="unit-code"
                className="unit-code font-mono uppercase"
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
              <Input
                id="unit-number"
                autoComplete="off"
                {...form.register("unitNumber")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Floor"
              error={form.formState.errors.floorId?.message}
              htmlFor="unit-floor"
            >
              <div className={selectWrapperClass}>
                <select
                  id="unit-floor"
                  className={selectInnerClass}
                  {...form.register("floorId")}
                >
                  {options.floors.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      {fl.name}
                    </option>
                  ))}
                </select>
                <CaretUpDown
                  weight="light"
                  className="pointer-events-none absolute right-2.5 size-3.5 text-ink-muted"
                />
              </div>
            </Field>
            <Field
              label="Category"
              error={form.formState.errors.categoryId?.message}
              htmlFor="unit-category"
            >
              <div className={selectWrapperClass}>
                <select
                  id="unit-category"
                  aria-label="Category"
                  className={selectInnerClass}
                  {...form.register("categoryId", {
                    onChange: (event) => {
                      if (mode === "edit") return;
                      const selected = options.categories.find(
                        (item) => item.id === event.target.value,
                      );
                      if (selected) {
                        form.setValue("isSellable", selected.isSellableDefault);
                      }
                    },
                  })}
                >
                  {options.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <CaretUpDown
                  weight="light"
                  className="pointer-events-none absolute right-2.5 size-3.5 text-ink-muted"
                />
              </div>
            </Field>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 pt-1 text-[13px] text-ink">
            <Checkbox
              checked={Boolean(isSellable)}
              onCheckedChange={(checked) => form.setValue("isSellable", Boolean(checked))}
            />
            <span className="font-medium select-none">Sellable inventory</span>
          </label>
        </section>

        {/* SECTION 2: AREA & PRICING */}
        <section className="space-y-3 border-t border-line pt-4">
          <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            Area &amp; Pricing
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Net area (sq ft)"
              error={form.formState.errors.netAreaSqft?.message}
              htmlFor="unit-net"
            >
              <Input
                id="unit-net"
                className="text-right font-mono tabular-nums"
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
                className="text-right font-mono tabular-nums"
                inputMode="decimal"
                disabled={soldLocked}
                {...form.register("grossAreaSqft")}
              />
              {grossWarning && (
                <p className="mt-1 text-[12px] text-accent">
                  Gross area is smaller than net area.
                </p>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Rate per sq ft (PKR)"
              error={form.formState.errors.ratePerSqftPkr?.message}
              htmlFor="unit-rate"
            >
              <Input
                id="unit-rate"
                className="text-right font-mono tabular-nums"
                inputMode="decimal"
                disabled={soldLocked}
                {...form.register("ratePerSqftPkr")}
              />
            </Field>
            <Field
              label="Price adjustment (PKR)"
              error={form.formState.errors.priceAdjustmentPkr?.message}
              htmlFor="unit-adj"
            >
              <Input
                id="unit-adj"
                className="text-right font-mono tabular-nums"
                inputMode="decimal"
                disabled={soldLocked}
                {...form.register("priceAdjustmentPkr")}
              />
            </Field>
          </div>

          <Field
            label="Adjustment reason"
            error={form.formState.errors.priceAdjustmentReason?.message}
            htmlFor="unit-adj-reason"
          >
            <Input
              id="unit-adj-reason"
              disabled={soldLocked}
              placeholder="e.g. Corner frontage premium"
              {...form.register("priceAdjustmentReason")}
            />
          </Field>

          {rateChanged && (
            <Field
              label="Rate change reason"
              error={form.formState.errors.rateChangeReason?.message}
              htmlFor="unit-rate-reason"
            >
              <Input
                id="unit-rate-reason"
                placeholder="Reason for altering the asking rate"
                {...form.register("rateChangeReason")}
              />
            </Field>
          )}

          {/* Live Price Summary Block: rate × area + adj = total */}
          <div className="space-y-2 rounded-[6px] border border-line bg-subtle/50 p-3.5">
            <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              <span>Live Price Calculation</span>
              <span>Rate × Area + Adj</span>
            </div>
            <div className="flex flex-col gap-1 border-t border-line/60 pt-2 font-mono text-[12px] text-ink-muted tabular-nums">
              <div className="flex justify-between">
                <span>
                  Base ({rate || "0"} × {net || "0"} sq ft)
                </span>
                <span>{liveBase ? `PKR ${liveBase}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Adjustment</span>
                <span>{adjustment ? formatPkrLedger(adjustment) : "Rs 0"}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-line/80 pt-2">
              <span className="text-[12px] font-medium text-ink">Total asking</span>
              <div className="text-right">
                <span className="font-mono text-[18px] font-semibold text-ink tabular-nums">
                  {liveTotal ? formatPkrLedger(liveTotal) : "—"}
                </span>
                {liveTotal && (
                  <p className="text-[11px] text-ink-muted tabular-nums">
                    {formatPkrCompact(liveTotal)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: OWNERSHIP */}
        <section className="space-y-3 border-t border-line pt-4">
          <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            Ownership
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ownership group" htmlFor="unit-owner">
              <Input id="unit-owner" {...form.register("ownershipGroup")} />
            </Field>
            <Field label="Sub-owner" htmlFor="unit-sub">
              <Input id="unit-sub" {...form.register("subOwner")} />
            </Field>
          </div>
          <Field label="Booking ref" htmlFor="unit-booking">
            <Input id="unit-booking" {...form.register("bookingRef")} />
          </Field>
        </section>

        {/* SECTION 4: NOTES */}
        <section className="space-y-3 border-t border-line pt-4">
          <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            Notes
          </p>
          <Field label="Additional remarks" htmlFor="unit-notes">
            <Textarea
              id="unit-notes"
              rows={3}
              placeholder="Internal ledger observations…"
              {...form.register("notes")}
            />
          </Field>
        </section>

        {soldLocked && (
          <p className="text-[12px] text-ink-muted italic">
            Rate, area, and adjustment are locked on sold units for non-admin accounts.
          </p>
        )}

        {error && (
          <p
            className="rounded-[4px] border border-sold/30 bg-sold/5 p-2.5 text-[12px] text-sold"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {/* Sticky Footer: Cancel / Save */}
      <div className="flex h-[56px] shrink-0 items-center justify-between border-t border-line bg-surface px-5">
        {mode === "edit" && onArchive ? (
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={pending}
            onClick={() => void onArchive()}
          >
            Archive unit
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={pending}>
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
      <Label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-muted">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] text-sold" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
