"use client";

import * as React from "react";
import { toast } from "sonner";
import { CurrencyDollar, ShieldCheck, Warning } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatPkr } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import { getFloorRateSummary, updateFloorRates } from "../actions";
import type { FloorRateSummary } from "../schema";

export interface FloorRatesDialogProps {
  floorId: string | null;
  floorName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isAdmin?: boolean;
}

interface FloorRatesFormProps {
  floorId: string;
  floorName?: string;
  onClose: () => void;
  onSuccess?: () => void;
  isAdmin: boolean;
}

function FloorRatesForm({
  floorId,
  floorName,
  onClose,
  onSuccess,
  isAdmin,
}: FloorRatesFormProps) {
  const [summary, setSummary] = React.useState<FloorRateSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [scope, setScope] = React.useState<"ALL" | "CATEGORY">("ALL");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [newRate, setNewRate] = React.useState<string>("");
  const [reason, setReason] = React.useState<string>("");
  const [includeSoldBooked, setIncludeSoldBooked] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    getFloorRateSummary(floorId)
      .then((data) => {
        if (!active) return;
        setSummary(data);
        if (data.categories.length > 0) {
          setCategoryId(data.categories[0]!.categoryId);
        }
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [floorId]);

  // Determine active category if filtered
  const activeCategory = React.useMemo(() => {
    if (scope !== "CATEGORY" || !summary) return null;
    return summary.categories.find((c) => c.categoryId === categoryId) ?? null;
  }, [scope, summary, categoryId]);

  // Compute unit target counts based on scope and includeSoldBooked
  const { targetCount, protectedCount, currentRateDisplay } = React.useMemo(() => {
    if (!summary) {
      return { targetCount: 0, protectedCount: 0, currentRateDisplay: "—" };
    }

    if (scope === "CATEGORY" && activeCategory) {
      const unsold = activeCategory.availableUnits;
      const total = activeCategory.totalUnits;
      const target = includeSoldBooked ? total : unsold;
      const protectedSold = total - unsold;

      let rateText = "No rates recorded";
      if (activeCategory.minRate && activeCategory.maxRate) {
        rateText =
          activeCategory.minRate === activeCategory.maxRate
            ? `Rs ${formatPkr(activeCategory.minRate)} / sqft`
            : `Rs ${formatPkr(activeCategory.minRate)} – ${formatPkr(activeCategory.maxRate)} / sqft`;
      }
      return {
        targetCount: target,
        protectedCount: protectedSold,
        currentRateDisplay: rateText,
      };
    }

    // Entire floor
    const unsold = summary.availableUnits + summary.reservedUnits;
    const total = summary.totalUnits;
    const target = includeSoldBooked ? total : unsold;
    const protectedSold = total - unsold;

    let rateText = "No rates recorded";
    if (summary.overallMinRate && summary.overallMaxRate) {
      rateText =
        summary.overallMinRate === summary.overallMaxRate
          ? `Rs ${formatPkr(summary.overallMinRate)} / sqft`
          : `Rs ${formatPkr(summary.overallMinRate)} – ${formatPkr(summary.overallMaxRate)} / sqft`;
    }

    return {
      targetCount: target,
      protectedCount: protectedSold,
      currentRateDisplay: rateText,
    };
  }, [summary, scope, activeCategory, includeSoldBooked]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitError(null);

    const cleanRate = newRate.replace(/,/g, "").trim();
    if (!cleanRate || Number(cleanRate) <= 0) {
      setSubmitError("Please enter a valid positive rate per square foot.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setSubmitError("A reason of at least 3 characters is required for audit logging.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateFloorRates({
        floorId,
        categoryId: scope === "CATEGORY" ? categoryId : null,
        newRatePerSqftPkr: cleanRate,
        reason: reason.trim(),
        includeSoldBooked,
      });

      toast.success(result.message);
      onClose();
      onSuccess?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const effectiveFloorName = summary?.floorName || floorName || "Floor";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 py-12">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-[12px] text-ink-muted">Loading floor details...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-5 text-center">
        <p className="text-danger text-[13px]">{loadError}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
        {/* Floor Overview Strip */}
        <div className="grid grid-cols-3 gap-2 rounded-[6px] border border-line bg-subtle/50 p-2.5 text-center">
          <div>
            <div className="text-[10.5px] font-medium tracking-wider text-ink-muted uppercase">
              Total Units
            </div>
            <div className="font-sans text-[15px] font-semibold text-ink tabular-nums">
              {summary.totalUnits}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-medium tracking-wider text-ink-muted uppercase">
              Unsold
            </div>
            <div className="text-success font-sans text-[15px] font-semibold tabular-nums">
              {summary.availableUnits + summary.reservedUnits}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-medium tracking-wider text-ink-muted uppercase">
              Sold / Booked
            </div>
            <div className="font-sans text-[15px] font-semibold text-ink-muted tabular-nums">
              {summary.soldUnits + summary.bookedUnits}
            </div>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-ink-muted">Update Scope</Label>
          <SegmentedControl
            value={scope}
            onValueChange={(val) => setScope(val as "ALL" | "CATEGORY")}
            options={[
              {
                value: "ALL",
                label: `Entire Floor (${summary.totalUnits} units)`,
              },
              {
                value: "CATEGORY",
                label: `By Category (${summary.categories.length})`,
              },
            ]}
            className="w-full"
          />
        </div>

        {/* Category Selector (when filtered) */}
        {scope === "CATEGORY" && (
          <div className="space-y-1.5">
            <Label
              htmlFor="category-select"
              className="text-[12px] font-medium text-ink-muted"
            >
              Select Category on {effectiveFloorName}
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category-select" size="md">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                {summary.categories.map((cat) => (
                  <SelectItem key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName} ({cat.totalUnits} units • {cat.availableUnits}{" "}
                    unsold)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Current Rate Display */}
        <div className="flex items-center justify-between rounded-[6px] border border-line bg-surface px-3 py-2 text-[12px]">
          <span className="text-ink-muted">Current Rate Range:</span>
          <span className="font-sans font-medium text-ink tabular-nums">
            {currentRateDisplay}
          </span>
        </div>

        {/* New Rate Input */}
        <div className="space-y-1.5">
          <Label htmlFor="new-rate" className="text-[12px] font-medium text-ink-muted">
            New Rate (PKR / Sq Ft) <span className="text-danger">*</span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[12px] font-medium text-ink-muted">
              Rs
            </span>
            <MoneyInput
              id="new-rate"
              value={newRate}
              onValueChange={setNewRate}
              placeholder="e.g. 18,500"
              allowDecimals={true}
              className="pl-9 font-sans text-[13px] tabular-nums"
              required
            />
          </div>
          <p className="text-[11px] text-ink-muted">
            Asking price will automatically recompute as:{" "}
            <code className="rounded bg-subtle px-1 py-0.5 text-[10.5px]">
              round(Rate × Area + Adjustment)
            </code>
          </p>
        </div>

        {/* Reason Input */}
        <div className="space-y-1.5">
          <Label htmlFor="rate-reason" className="text-[12px] font-medium text-ink-muted">
            Reason for Rate Change <span className="text-danger">*</span>
          </Label>
          <Input
            id="rate-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Q1 2026 Price Escalation / Floor premium revision"
            className="text-[12.5px]"
            required
          />
          <p className="text-[11px] text-ink-muted">
            Permanently recorded in the unit rate history and audit log.
          </p>
        </div>

        {/* Protection Notice / Admin Override */}
        <div className="rounded-[6px] border border-line bg-subtle/40 p-3 text-[12px]">
          <div className="flex items-start gap-2">
            <ShieldCheck weight="fill" className="text-success mt-0.5 size-4 shrink-0" />
            <div className="space-y-1 text-ink-muted">
              <p className="font-medium text-ink">Customer Contract Protection Active</p>
              <p className="text-[11.5px] leading-relaxed">
                This update will target{" "}
                <strong className="text-ink">
                  {targetCount} unsold unit{targetCount === 1 ? "" : "s"}
                </strong>
                .
                {protectedCount > 0 && !includeSoldBooked && (
                  <span>
                    {" "}
                    <strong className="text-ink">
                      {protectedCount} Sold/Booked
                    </strong>{" "}
                    unit{protectedCount === 1 ? "" : "s"} will remain unchanged to protect
                    existing sales contracts.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Admin override checkbox */}
          {isAdmin && protectedCount > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5">
              <div className="pr-3">
                <Label
                  htmlFor="include-sold-toggle"
                  className="cursor-pointer text-[11.5px] font-medium text-ink"
                >
                  Administrative Override
                </Label>
                <p className="text-[10.5px] text-ink-muted">
                  Include Sold/Booked units in this rate update
                </p>
              </div>
              <Switch
                id="include-sold-toggle"
                checked={includeSoldBooked}
                onCheckedChange={setIncludeSoldBooked}
              />
            </div>
          )}
        </div>

        {/* Warning if override enabled */}
        {includeSoldBooked && (
          <div className="flex items-start gap-2 rounded-[6px] border border-amber-300 bg-amber-50 p-2.5 text-[11.5px] text-amber-900">
            <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>
              <strong>Warning:</strong> You are updating rates on sold or booked units.
              This will alter the recorded asking rate on active customer agreements.
            </p>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="border-danger/30 bg-danger-soft text-danger rounded-[6px] border p-2.5 text-[12px]">
            {submitError}
          </div>
        )}
      </div>

      <DialogFooter className="border-t border-line bg-subtle/50 px-5 py-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={submitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={submitting || targetCount === 0 || !newRate.trim()}
        >
          {submitting
            ? "Updating rates..."
            : `Update ${targetCount} Unit${targetCount === 1 ? "" : "s"}`}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function FloorRatesDialog({
  floorId,
  floorName,
  open,
  onOpenChange,
  onSuccess,
  isAdmin = false,
}: FloorRatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-[6px] bg-primary/10 text-primary">
              <CurrencyDollar weight="bold" className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-ink">
                Update Rates — {floorName || "Floor"}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-ink-muted">
                Batch adjust the base asking rate (PKR / sq ft) across units on this
                level.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && floorId ? (
          <FloorRatesForm
            key={floorId}
            floorId={floorId}
            floorName={floorName}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            isAdmin={isAdmin}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
