"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  GitMerge,
  MagnifyingGlass,
  UploadSimple,
  X,
  FileText,
  Sparkle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/db/schema/enums";
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import {
  computeTotalPrice,
  formatDecimal,
  formatPkrLedger,
  parseDecimal,
} from "@/lib/money";
import type { InventoryFilterOptions, InventoryRow } from "../types";
import { createMergeProofUploadUrl, requestUnitMerge } from "../merge-actions";

interface MergeUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUnits: InventoryRow[];
  options: InventoryFilterOptions;
  role: UserRole;
  onSuccess?: () => void;
}

export function MergeUnitsDialog({
  open,
  onOpenChange,
  availableUnits,
  options,
  role,
  onSuccess,
}: MergeUnitsDialogProps) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";

  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [proposedUnitCode, setProposedUnitCode] = React.useState("");
  const [proposedUnitNumber, setProposedUnitNumber] = React.useState("");
  const [targetFloorId, setTargetFloorId] = React.useState("");
  const [targetCategoryId, setTargetCategoryId] = React.useState("");
  const [proposedNetAreaSqft, setProposedNetAreaSqft] = React.useState("");
  const [proposedGrossAreaSqft, setProposedGrossAreaSqft] = React.useState("");
  const [proposedRatePerSqftPkr, setProposedRatePerSqftPkr] = React.useState("");
  const [proposedPriceAdjustmentPkr, setProposedPriceAdjustmentPkr] = React.useState("0");
  const [proposedPriceAdjustmentReason, setProposedPriceAdjustmentReason] =
    React.useState("");
  const [reason, setReason] = React.useState("");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [approveImmediately, setApproveImmediately] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const selectedUnits = React.useMemo(
    () =>
      selectedIds
        .map((id) => availableUnits.find((u) => u.id === id))
        .filter((u): u is InventoryRow => Boolean(u)),
    [selectedIds, availableUnits],
  );

  // Auto-calculate merged unit dimensions, rate, and code whenever source units change
  function applyAutoDefaults(nextUnits: InventoryRow[]) {
    if (nextUnits.length < 2) return;

    let sumNet = 0n;
    let sumGross = 0n;
    let sumPrice = 0n;

    for (const u of nextUnits) {
      const net = parseDecimal(u.netAreaSqft);
      const gross = parseDecimal(effectivePricingArea(u.grossAreaSqft, u.netAreaSqft));
      const price = parseDecimal(u.computedPricePkr);
      sumNet += net;
      sumGross += gross;
      sumPrice += price;
    }

    const first = nextUnits[0]!;
    const suffix = nextUnits
      .slice(1)
      .map((u) => u.unitCode.split("-").pop() ?? u.unitCode)
      .join("-");
    const suggestedCode = `${first.unitCode}-${suffix}`.slice(0, 32).toUpperCase();
    const suggestedNumber = nextUnits
      .map((u) => u.unitNumber)
      .join(" + ")
      .slice(0, 64);

    // Weighted average rate = round(sumPrice * 100 / sumGross)
    const weightedRatePaisa =
      sumGross > 0n
        ? (sumPrice * 100n + sumGross / 2n) / sumGross
        : parseDecimal(first.ratePerSqftPkr);

    setProposedUnitCode(suggestedCode);
    setProposedUnitNumber(suggestedNumber);
    setTargetFloorId(first.floorId);
    setTargetCategoryId(first.categoryId);
    setProposedNetAreaSqft(formatDecimal(sumNet));
    setProposedGrossAreaSqft(formatDecimal(sumGross));
    setProposedRatePerSqftPkr(formatDecimal(weightedRatePaisa));
    setProposedPriceAdjustmentPkr("0");
    setProposedPriceAdjustmentReason("");
  }

  const filteredUnits = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableUnits
      .filter((u) => u.status === "AVAILABLE")
      .filter((u) => {
        if (!q) return true;
        return (
          u.unitCode.toLowerCase().includes(q) ||
          u.unitNumber.toLowerCase().includes(q) ||
          u.floorName.toLowerCase().includes(q) ||
          u.categoryName.toLowerCase().includes(q)
        );
      })
      .slice(0, 60);
  }, [availableUnits, search]);

  const computedNewPrice = React.useMemo(() => {
    try {
      if (!proposedGrossAreaSqft || !proposedRatePerSqftPkr) return "0.00";
      return computeTotalPrice(
        proposedRatePerSqftPkr,
        proposedGrossAreaSqft,
        proposedPriceAdjustmentPkr || "0",
      );
    } catch {
      return "0.00";
    }
  }, [proposedGrossAreaSqft, proposedRatePerSqftPkr, proposedPriceAdjustmentPkr]);

  const originalCombinedPrice = React.useMemo(() => {
    let total = 0n;
    for (const u of selectedUnits) {
      total += parseDecimal(u.computedPricePkr);
    }
    return formatDecimal(total);
  }, [selectedUnits]);

  function toggleUnit(id: string) {
    let nextIds: string[];
    if (selectedIds.includes(id)) {
      nextIds = selectedIds.filter((x) => x !== id);
    } else if (selectedIds.length >= 3) {
      toast.error("You can merge at most 3 units at a time.");
      return;
    } else {
      nextIds = [...selectedIds, id];
    }
    setSelectedIds(nextIds);
    const nextUnits = nextIds
      .map((uid) => availableUnits.find((u) => u.id === uid))
      .filter((u): u is InventoryRow => Boolean(u));
    applyAutoDefaults(nextUnits);
  }

  function resetForm() {
    setSearch("");
    setSelectedIds([]);
    setProposedUnitCode("");
    setProposedUnitNumber("");
    setTargetFloorId("");
    setTargetCategoryId("");
    setProposedNetAreaSqft("");
    setProposedGrossAreaSqft("");
    setProposedRatePerSqftPkr("");
    setProposedPriceAdjustmentPkr("0");
    setProposedPriceAdjustmentReason("");
    setReason("");
    setProofFile(null);
    setApproveImmediately(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      toast.error("Select 2 or 3 available units to merge.");
      return;
    }
    if (!proofFile) {
      toast.error("Please upload proof document (architectural plan / approval memo).");
      return;
    }
    if (reason.trim().length < 5) {
      toast.error("Please enter a merge reason (at least 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const uploadMeta = await createMergeProofUploadUrl({
        mimeType: proofFile.type,
        fileName: proofFile.name,
        sizeBytes: proofFile.size,
      });

      const putRes = await fetch(uploadMeta.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": proofFile.type },
        body: proofFile,
      });
      if (!putRes.ok) {
        throw new Error("Failed to upload proof file to storage.");
      }

      const res = await requestUnitMerge({
        sourceUnitIds: selectedIds,
        proposedUnitCode,
        proposedUnitNumber,
        targetFloorId,
        targetCategoryId,
        proposedNetAreaSqft,
        proposedGrossAreaSqft,
        proposedRatePerSqftPkr,
        proposedPriceAdjustmentPkr: proposedPriceAdjustmentPkr || "0",
        proposedPriceAdjustmentReason: proposedPriceAdjustmentReason || null,
        reason: reason.trim(),
        proofStoragePath: uploadMeta.storagePath,
        proofMimeType: proofFile.type,
        proofFileName: proofFile.name,
        approveImmediately: isAdmin && approveImmediately,
      });

      if (res.status === "APPROVED" && res.resultingUnitId) {
        toast.success(`Units merged into ${proposedUnitCode.toUpperCase()}!`);
        resetForm();
        onOpenChange(false);
        onSuccess?.();
        router.push(`/units/${res.resultingUnitId}` as never);
      } else {
        toast.success("Merge request submitted for Admin approval.");
        resetForm();
        onOpenChange(false);
        onSuccess?.();
        router.push("/inventory/merges" as never);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit merge request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge weight="light" className="size-5 text-primary" />
            Merge &amp; Restructure Units (2 or 3 Units)
          </DialogTitle>
          <DialogDescription>
            Combine 2 or 3 available units into a single restructured unit. Prices update
            automatically from Gross Sq. Ft. × Rate and remain editable. Requires reason,
            proof upload, and Admin approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Step 1: Select 2 or 3 AVAILABLE units */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[13px] font-semibold text-ink">
                1. Select 2 or 3 Available Units ({selectedIds.length}/3 selected)
              </Label>
              <div className="relative w-60">
                <MagnifyingGlass
                  weight="light"
                  className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search available units…"
                  className="h-8 w-full rounded-[8px] border border-line bg-surface pr-2.5 pl-8 text-[12px] text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                />
              </div>
            </div>

            {selectedUnits.length > 0 && (
              <div className="grid grid-cols-1 gap-2 rounded-[8px] border border-primary/25 bg-primary-soft/30 p-3 sm:grid-cols-3">
                {selectedUnits.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start justify-between gap-2 rounded-[6px] border border-line bg-surface p-2.5 text-[12px]"
                  >
                    <div className="min-w-0">
                      <p className="unit-code truncate font-sans tabular-nums font-semibold text-primary">
                        {formatUnitDisplayCode(u.unitCode, u.categoryName)}
                      </p>
                      <p className="truncate text-[11px] text-ink-muted">
                        {u.floorName} · {u.categoryName}
                      </p>
                      <p className="mt-1 text-[11px] text-ink tabular-nums">
                        Gross: {effectivePricingArea(u.grossAreaSqft, u.netAreaSqft)} sq
                        ft · Net: {u.netAreaSqft}
                      </p>
                      <p className="font-medium text-ink tabular-nums">
                        {formatPkrLedger(u.computedPricePkr)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleUnit(u.id)}
                      className="rounded p-0.5 text-ink-muted hover:bg-subtle hover:text-ink"
                      aria-label={`Remove ${u.unitCode}`}
                    >
                      <X weight="bold" className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="max-h-44 overflow-y-auto rounded-[8px] border border-line">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 border-b border-line bg-subtle text-[11px] font-medium text-ink-muted">
                  <tr>
                    <th className="w-8 px-2.5 py-2" />
                    <th className="px-2.5 py-2">Unit Code</th>
                    <th className="px-2.5 py-2">Floor</th>
                    <th className="px-2.5 py-2">Category</th>
                    <th className="px-2.5 py-2 text-right">Gross (sq ft)</th>
                    <th className="px-2.5 py-2 text-right">Asking Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredUnits.map((u) => {
                    const checked = selectedIds.includes(u.id);
                    return (
                      <tr
                        key={u.id}
                        onClick={() => toggleUnit(u.id)}
                        className={`cursor-pointer transition-colors ${
                          checked ? "bg-primary-soft/50" : "hover:bg-subtle/60"
                        }`}
                      >
                        <td className="px-2.5 py-1.5">
                          <Checkbox checked={checked} aria-label={u.unitCode} />
                        </td>
                        <td className="unit-code px-2.5 py-1.5 font-sans tabular-nums font-medium text-ink">
                          {formatUnitDisplayCode(u.unitCode, u.categoryName)}
                        </td>
                        <td className="px-2.5 py-1.5 text-ink-muted">{u.floorName}</td>
                        <td className="px-2.5 py-1.5 text-ink-muted">{u.categoryName}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums">
                          {effectivePricingArea(u.grossAreaSqft, u.netAreaSqft)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-medium tabular-nums">
                          {formatPkrLedger(u.computedPricePkr)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-ink-muted">
                        No matching available units found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2: Auto-restructured combined details (editable) */}
          {selectedUnits.length >= 2 && (
            <div className="space-y-4 rounded-[10px] border border-line bg-subtle/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                  <Sparkle weight="light" className="size-4 text-primary" />
                  2. Combined &amp; Restructured Unit Details (Editable)
                </div>
                <div className="text-[12px] text-ink-muted tabular-nums">
                  Original combined total:{" "}
                  <strong className="text-ink">
                    {formatPkrLedger(originalCombinedPrice)}
                  </strong>{" "}
                  → New total:{" "}
                  <strong className="text-primary">
                    {formatPkrLedger(computedNewPrice)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="mb-1 block text-[12px]">Combined Unit Code *</Label>
                  <Input
                    value={proposedUnitCode}
                    onChange={(e) => {
                      setProposedUnitCode(e.target.value.toUpperCase());
                    }}
                    placeholder="e.g. GF-S1-S2"
                    className="unit-code font-sans tabular-nums"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">Unit Number / Name *</Label>
                  <Input
                    value={proposedUnitNumber}
                    onChange={(e) => {
                      setProposedUnitNumber(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">Floor *</Label>
                  <Select
                    value={targetFloorId}
                    onValueChange={(v) => {
                      setTargetFloorId(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.floors.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">
                    Category (Restructure) *
                  </Label>
                  <Select
                    value={targetCategoryId}
                    onValueChange={(v) => {
                      setTargetCategoryId(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1 block text-[12px]">Gross Area (sq ft) *</Label>
                  <Input
                    value={proposedGrossAreaSqft}
                    onChange={(e) => {
                      setProposedGrossAreaSqft(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">
                    Net Area (sq ft, internal) *
                  </Label>
                  <Input
                    value={proposedNetAreaSqft}
                    onChange={(e) => {
                      setProposedNetAreaSqft(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">Rate / Sq. Ft. (PKR) *</Label>
                  <MoneyInput
                    value={proposedRatePerSqftPkr}
                    onValueChange={(v) => {
                      setProposedRatePerSqftPkr(v);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-[12px]">Price Adjustment (PKR)</Label>
                  <MoneyInput
                    value={proposedPriceAdjustmentPkr}
                    allowNegative
                    onValueChange={(v) => {
                      setProposedPriceAdjustmentPkr(v || "0");
                    }}
                  />
                </div>
              </div>

              {proposedPriceAdjustmentPkr &&
                proposedPriceAdjustmentPkr !== "0" &&
                proposedPriceAdjustmentPkr !== "0.00" && (
                  <div>
                    <Label className="mb-1 block text-[12px]">
                      Price Adjustment Reason *
                    </Label>
                    <Input
                      value={proposedPriceAdjustmentReason}
                      onChange={(e) => setProposedPriceAdjustmentReason(e.target.value)}
                      placeholder="Explain adjustment on merged unit price"
                      required
                    />
                  </div>
                )}
            </div>
          )}

          {/* Step 3: Reason & Proof Upload */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-[12px] font-medium">
                3. Merge Reason *
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Client requested combined showroom across GF-S1 and GF-S2 per architect layout revision #4"
                required
              />
            </div>
            <div>
              <Label className="mb-1 block text-[12px] font-medium">
                4. Proof Document (Image / PDF, max 5 MB) *
              </Label>
              <label className="flex h-[82px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-line-strong bg-subtle/40 px-3 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/20">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error("Proof file must be under 5 MB.");
                      return;
                    }
                    setProofFile(file);
                  }}
                />
                {proofFile ? (
                  <div className="flex items-center gap-2 text-[12px] font-medium text-primary">
                    <FileText weight="light" className="size-4 shrink-0" />
                    <span className="max-w-[220px] truncate">{proofFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[12px] text-ink-muted">
                    <UploadSimple weight="light" className="size-4 text-primary" />
                    <span>Click to upload signed approval / layout proof</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {isAdmin && (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-[8px] border border-line bg-subtle/50 px-3.5 py-2.5 text-[12px]">
              <Checkbox
                checked={approveImmediately}
                onCheckedChange={(v) => setApproveImmediately(Boolean(v))}
              />
              <span className="text-ink">
                <strong>Admin quick-approve:</strong> Execute merge immediately upon
                submission (otherwise save to Pending Merge Requests for review).
              </span>
            </label>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || selectedIds.length < 2}
            >
              <Check weight="bold" className="mr-1.5 size-4" />
              {submitting
                ? "Submitting…"
                : isAdmin && approveImmediately
                  ? "Approve & Merge Units"
                  : "Submit for Admin Approval"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
