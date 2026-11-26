"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  GitMerge,
  MagnifyingGlass,
  UploadSimple,
  FileText,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
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

interface MergeWizardScreenProps {
  availableUnits: InventoryRow[];
  options: InventoryFilterOptions;
  role: UserRole;
}

export function MergeWizardScreen({
  availableUnits,
  options,
  role,
}: MergeWizardScreenProps) {
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

  function applyAutoDefaults(nextUnits: InventoryRow[]) {
    if (nextUnits.length < 2) return;

    let sumNet = 0n;
    let sumGross = 0n;
    let sumPrice = 0n;

    for (const u of nextUnits) {
      sumNet += parseDecimal(u.netAreaSqft || "0");
      sumGross += parseDecimal(u.grossAreaSqft || u.netAreaSqft || "0");
      const price = parseDecimal(u.bookPricePkr || "0");
      sumPrice += price;
    }

    const netStr = formatDecimal(sumNet);
    const grossStr = formatDecimal(sumGross);
    const firstUnit = nextUnits[0]!;

    const cleanCodes = nextUnits.map((u) => u.unitCode.trim());
    const mergedCode = cleanCodes.join("-");
    const mergedNumber = nextUnits
      .map((u) => (u.unitNumber ? u.unitNumber.trim() : ""))
      .filter(Boolean)
      .join("-");

    const effectiveArea = parseDecimal(grossStr) > 0n ? sumGross : sumNet;
    let weightedRate = firstUnit.ratePerSqftPkr;
    if (effectiveArea > 0n && sumPrice > 0n) {
      const rateNumber = Math.round(Number(sumPrice) / Number(effectiveArea));
      weightedRate = rateNumber.toString();
    }

    setProposedUnitCode(mergedCode);
    setProposedUnitNumber(mergedNumber || cleanCodes[0] || "");
    setTargetFloorId(firstUnit.floorId);
    setTargetCategoryId(firstUnit.categoryId);
    setProposedNetAreaSqft(netStr);
    setProposedGrossAreaSqft(grossStr);
    setProposedRatePerSqftPkr(weightedRate);
    setProposedPriceAdjustmentPkr("0");
    setProposedPriceAdjustmentReason("");
  }

  function toggleUnitSelection(unit: InventoryRow) {
    if (selectedIds.includes(unit.id)) {
      const nextIds = selectedIds.filter((id) => id !== unit.id);
      setSelectedIds(nextIds);
      const nextUnits = nextIds
        .map((id) => availableUnits.find((u) => u.id === id))
        .filter((u): u is InventoryRow => Boolean(u));
      applyAutoDefaults(nextUnits);
      return;
    }

    if (selectedIds.length >= 3) {
      toast.warning("Maximum of 3 units can be merged together");
      return;
    }

    if (selectedUnits.length > 0) {
      const first = selectedUnits[0]!;
      if (first.floorId !== unit.floorId) {
        toast.warning(
          `Can only merge units on the same floor (${first.floorName || "Floor"}).`,
        );
        return;
      }
    }

    const nextIds = [...selectedIds, unit.id];
    setSelectedIds(nextIds);
    const nextUnits = nextIds
      .map((id) => availableUnits.find((u) => u.id === id))
      .filter((u): u is InventoryRow => Boolean(u));
    applyAutoDefaults(nextUnits);
  }

  const filteredAvailable = React.useMemo(() => {
    if (!search.trim()) return availableUnits;
    const q = search.toLowerCase();
    return availableUnits.filter(
      (u) =>
        u.unitCode.toLowerCase().includes(q) ||
        (u.unitNumber && u.unitNumber.toLowerCase().includes(q)) ||
        (u.floorName && u.floorName.toLowerCase().includes(q)) ||
        (u.categoryName && u.categoryName.toLowerCase().includes(q)),
    );
  }, [availableUnits, search]);

  const effectiveArea = effectivePricingArea(proposedGrossAreaSqft, proposedNetAreaSqft);
  let calculatedTotal = "0.00";
  try {
    if (
      effectiveArea &&
      effectiveArea.trim() !== "" &&
      proposedRatePerSqftPkr &&
      proposedRatePerSqftPkr.trim() !== ""
    ) {
      calculatedTotal = computeTotalPrice(
        proposedRatePerSqftPkr,
        effectiveArea,
        proposedPriceAdjustmentPkr || "0",
      );
    }
  } catch {
    calculatedTotal = "0.00";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      toast.error("Please select exactly 2 or 3 available units to merge.");
      return;
    }
    if (!proposedUnitCode.trim()) {
      toast.error("Proposed unit code is required.");
      return;
    }
    if (!proposedUnitNumber.trim()) {
      toast.error("Proposed unit number is required.");
      return;
    }
    if (!targetFloorId) {
      toast.error("Target floor is required.");
      return;
    }
    if (!targetCategoryId) {
      toast.error("Target category is required.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("Please provide a valid merge reason (at least 5 characters).");
      return;
    }
    if (!proofFile) {
      toast.error("Proof document (PDF or image) is mandatory for unit restructuring.");
      return;
    }

    setSubmitting(true);
    try {
      const uploadIntent = await createMergeProofUploadUrl({
        mimeType: proofFile.type as
          "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
        fileName: proofFile.name,
        sizeBytes: proofFile.size,
      });

      const putRes = await fetch(uploadIntent.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": proofFile.type },
        body: proofFile,
      });

      if (!putRes.ok) {
        throw new Error(`Failed to upload proof document: HTTP ${putRes.status}`);
      }

      const res = await requestUnitMerge({
        sourceUnitIds: selectedIds,
        proposedUnitCode: proposedUnitCode.trim(),
        proposedUnitNumber: proposedUnitNumber.trim(),
        targetFloorId,
        targetCategoryId,
        proposedNetAreaSqft,
        proposedGrossAreaSqft: proposedGrossAreaSqft || proposedNetAreaSqft,
        proposedRatePerSqftPkr,
        proposedPriceAdjustmentPkr: proposedPriceAdjustmentPkr || "0",
        proposedPriceAdjustmentReason: proposedPriceAdjustmentReason.trim() || null,
        reason: reason.trim(),
        proofStoragePath: uploadIntent.storagePath,
        proofMimeType: proofFile.type,
        proofFileName: proofFile.name,
        approveImmediately: isAdmin && approveImmediately,
      });

      toast.success(
        res.status === "APPROVED"
          ? "Units merged successfully!"
          : "Merge request submitted for Admin review.",
      );

      router.push("/inventory");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit merge request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Merge & Restructure Units"
        description="Combine 2 or 3 available units into a single restructured unit. Prices update automatically from Gross Sq. Ft. × Rate and remain editable."
        back={{ href: "/inventory", label: "Inventory" }}
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Source selection, Configuration, Justification */}
        <div className="space-y-6 lg:col-span-8">
          {/* Section 1: Source Units Selection */}
          <Panel
            title="1. Select 2 or 3 Available Units"
            hint={`${selectedIds.length}/3 selected (must be on the same floor)`}
          >
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlass
                  weight="regular"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
                />
                <Input
                  type="search"
                  placeholder="Filter available units by code, number, floor, or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9.5 text-[13px]"
                />
              </div>

              <div className="max-h-72 overflow-y-auto rounded-[8px] border border-line bg-surface">
                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="h-9 border-b border-line bg-[#FAFBFC] text-left text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                      <th className="w-10 px-3 text-center" />
                      <th className="px-3">Unit Code</th>
                      <th className="px-3">Floor</th>
                      <th className="px-3">Category</th>
                      <th className="px-3 text-right">Gross (sq ft)</th>
                      <th className="px-3 text-right">Asking Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredAvailable.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="h-24 text-center text-ink-muted">
                          No available units match search.
                        </td>
                      </tr>
                    ) : (
                      filteredAvailable.map((u) => {
                        const isChecked = selectedIds.includes(u.id);
                        return (
                          <tr
                            key={u.id}
                            onClick={() => toggleUnitSelection(u)}
                            className={`cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-primary-soft/50 hover:bg-primary-soft/70"
                                : "hover:bg-subtle/50"
                            }`}
                          >
                            <td
                              className="px-3 py-2 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleUnitSelection(u)}
                                aria-label={`Select ${u.unitCode}`}
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-ink">
                              {formatUnitDisplayCode(u.unitCode, u.categoryName)}
                            </td>
                            <td className="px-3 py-2 text-ink-muted">{u.floorName}</td>
                            <td className="px-3 py-2 text-ink-muted">{u.categoryName}</td>
                            <td className="px-3 py-2 text-right font-sans text-ink tabular-nums">
                              {u.grossAreaSqft || u.netAreaSqft}
                            </td>
                            <td className="px-3 py-2 text-right font-sans font-medium text-ink tabular-nums">
                              Rs {formatPkrLedger(u.bookPricePkr || "0")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>

          {/* Section 2: Merged Unit Details */}
          <Panel
            title="2. Merged Unit Details & Configuration"
            hint="Auto-calculated from source units; editable as needed"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="proposed-code"
                  className="text-[12px] font-medium text-ink"
                >
                  Proposed Unit Code *
                </Label>
                <Input
                  id="proposed-code"
                  value={proposedUnitCode}
                  onChange={(e) => setProposedUnitCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 10F-RA1-RA2"
                  disabled={selectedIds.length < 2}
                  className="font-medium uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="proposed-number"
                  className="text-[12px] font-medium text-ink"
                >
                  Proposed Unit Number *
                </Label>
                <Input
                  id="proposed-number"
                  value={proposedUnitNumber}
                  onChange={(e) => setProposedUnitNumber(e.target.value)}
                  placeholder="e.g. RA1-RA2"
                  disabled={selectedIds.length < 2}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="target-floor"
                  className="text-[12px] font-medium text-ink"
                >
                  Floor *
                </Label>
                <Select
                  value={targetFloorId}
                  onValueChange={setTargetFloorId}
                  disabled={selectedIds.length < 2}
                >
                  <SelectTrigger id="target-floor">
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

              <div className="space-y-1.5">
                <Label
                  htmlFor="target-category"
                  className="text-[12px] font-medium text-ink"
                >
                  Category *
                </Label>
                <Select
                  value={targetCategoryId}
                  onValueChange={setTargetCategoryId}
                  disabled={selectedIds.length < 2}
                >
                  <SelectTrigger id="target-category">
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

              <div className="space-y-1.5">
                <Label htmlFor="net-area" className="text-[12px] font-medium text-ink">
                  Total Net Area (sq ft) *
                </Label>
                <Input
                  id="net-area"
                  type="number"
                  step="0.01"
                  value={proposedNetAreaSqft}
                  onChange={(e) => setProposedNetAreaSqft(e.target.value)}
                  disabled={selectedIds.length < 2}
                  className="tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gross-area" className="text-[12px] font-medium text-ink">
                  Total Gross Area (sq ft)
                </Label>
                <Input
                  id="gross-area"
                  type="number"
                  step="0.01"
                  value={proposedGrossAreaSqft}
                  onChange={(e) => setProposedGrossAreaSqft(e.target.value)}
                  disabled={selectedIds.length < 2}
                  className="tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="rate-per-sqft"
                  className="text-[12px] font-medium text-ink"
                >
                  Rate per sq ft (Rs) *
                </Label>
                <MoneyInput
                  id="rate-per-sqft"
                  value={proposedRatePerSqftPkr}
                  onValueChange={setProposedRatePerSqftPkr}
                  disabled={selectedIds.length < 2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price-adj" className="text-[12px] font-medium text-ink">
                  Price Adjustment (Rs)
                </Label>
                <MoneyInput
                  id="price-adj"
                  value={proposedPriceAdjustmentPkr}
                  onValueChange={setProposedPriceAdjustmentPkr}
                  disabled={selectedIds.length < 2}
                />
              </div>

              {proposedPriceAdjustmentPkr && proposedPriceAdjustmentPkr !== "0" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="adj-reason"
                    className="text-[12px] font-medium text-ink"
                  >
                    Adjustment Reason
                  </Label>
                  <Input
                    id="adj-reason"
                    value={proposedPriceAdjustmentReason}
                    onChange={(e) => setProposedPriceAdjustmentReason(e.target.value)}
                    placeholder="e.g. Corner showroom revision discount"
                  />
                </div>
              )}
            </div>
          </Panel>

          {/* Section 3: Justification & Proof Upload */}
          <Panel
            title="3. Merge Reason & Architectural Proof"
            hint="Mandatory compliance documentation for unit ledger modifications"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="merge-reason"
                  className="text-[12px] font-medium text-ink"
                >
                  Merge Reason *
                </Label>
                <Textarea
                  id="merge-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Client requested combined showroom across GF-S1 and GF-S2 per architect layout revision #4"
                  className="text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-ink">
                  Proof Document (PDF or image, max 5 MB) *
                </Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="proof-upload"
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed border-line-strong bg-subtle/40 p-4 text-[13px] text-ink-muted transition-colors hover:border-primary hover:bg-primary-soft/20"
                  >
                    <UploadSimple weight="regular" className="size-5 text-primary" />
                    <span>
                      {proofFile
                        ? proofFile.name
                        : "Click to select signed approval / layout proof"}
                    </span>
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Proof file must be under 5 MB");
                            return;
                          }
                          setProofFile(file);
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                  {proofFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setProofFile(null)}
                      className="text-bad"
                      title="Remove file"
                    >
                      <Trash weight="regular" className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="rounded-[8px] border border-primary/20 bg-primary-soft/40 p-3">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <Checkbox
                      checked={approveImmediately}
                      onCheckedChange={(checked) =>
                        setApproveImmediately(Boolean(checked))
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-[12.5px] font-medium text-ink">
                        Admin quick-approve: Execute merge immediately
                      </span>
                      <p className="text-[11.5px] text-ink-muted">
                        Archive source units and create the merged unit immediately upon
                        submission without pending approval queue.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column: Sticky Summary & Submission Card */}
        <div className="space-y-6 lg:col-span-4">
          <div className="sticky top-6 rounded-[8px] border border-line bg-surface p-5 shadow-xs">
            <h3 className="text-[15px] font-semibold text-ink">Merge Summary</h3>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Review restructured unit calculations
            </p>

            <div className="mt-4 divide-y divide-line text-[12.5px]">
              <div className="py-2.5">
                <span className="text-ink-muted">Source units:</span>
                {selectedUnits.length === 0 ? (
                  <p className="mt-1 text-[12px] text-ink-faint">None selected yet</p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedUnits.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 rounded bg-subtle px-2 py-0.5 font-sans font-medium text-ink"
                      >
                        {u.unitCode}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Total Net Area:</span>
                <span className="font-sans font-medium text-ink tabular-nums">
                  {proposedNetAreaSqft || "0.00"} sq ft
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Total Gross Area:</span>
                <span className="font-sans font-medium text-ink tabular-nums">
                  {proposedGrossAreaSqft || proposedNetAreaSqft || "0.00"} sq ft
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Rate / sq ft:</span>
                <span className="font-sans font-medium text-ink tabular-nums">
                  Rs {formatPkrLedger(proposedRatePerSqftPkr || "0")}
                </span>
              </div>

              <div className="flex items-center justify-between border-t-2 border-line py-3">
                <span className="font-medium text-ink">Calculated Price:</span>
                <span className="font-sans text-[15px] font-bold text-primary tabular-nums">
                  Rs {formatPkrLedger(calculatedTotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={selectedIds.length < 2 || submitting}
                loading={submitting}
                leftIcon={<GitMerge weight="regular" className="size-4" />}
                className="w-full"
              >
                {isAdmin && approveImmediately
                  ? "Execute Merge Immediately"
                  : "Submit for Admin Approval"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                asChild
                className="w-full"
              >
                <Link href="/inventory">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
