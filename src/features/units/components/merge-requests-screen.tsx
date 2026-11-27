"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  FileText,
  GitMerge,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MergeRequestStatus, UserRole } from "@/db/schema/enums";
import { effectivePricingArea, formatSqft, formatUnitDisplayCode } from "@/lib/area";
import { computeTotalPrice, formatPkrLedger } from "@/lib/money";
import type { MergeRequestListItem } from "../merge-queries";
import type { InventoryFilterOptions } from "../types";
import { approveUnitMerge, rejectUnitMerge } from "../merge-actions";

interface MergeRequestsScreenProps {
  requests: MergeRequestListItem[];
  options: InventoryFilterOptions;
  role: UserRole;
}

export function MergeRequestsScreen({
  requests: initialRequests,
  options,
  role,
}: MergeRequestsScreenProps) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";
  const [statusFilter, setStatusFilter] = React.useState<MergeRequestStatus | "ALL">(
    "ALL",
  );

  // Approve modal state (with editable overrides)
  const [approvingItem, setApprovingItem] = React.useState<MergeRequestListItem | null>(
    null,
  );
  const [editCode, setEditCode] = React.useState("");
  const [editNumber, setEditNumber] = React.useState("");
  const [editFloorId, setEditFloorId] = React.useState("");
  const [editCategoryId, setEditCategoryId] = React.useState("");
  const [editNetArea, setEditNetArea] = React.useState("");
  const [editGrossArea, setEditGrossArea] = React.useState("");
  const [editRate, setEditRate] = React.useState("");
  const [editAdj, setEditAdj] = React.useState("0");
  const [editAdjReason, setEditAdjReason] = React.useState("");

  // Reject modal state
  const [rejectingItem, setRejectingItem] = React.useState<MergeRequestListItem | null>(
    null,
  );
  const [rejectReason, setRejectReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const visibleRequests = React.useMemo(
    () =>
      statusFilter === "ALL"
        ? initialRequests
        : initialRequests.filter((r) => r.status === statusFilter),
    [initialRequests, statusFilter],
  );

  const pendingCount = initialRequests.filter((r) => r.status === "PENDING").length;

  function openApproveDialog(item: MergeRequestListItem) {
    setApprovingItem(item);
    setEditCode(item.proposedUnitCode);
    setEditNumber(item.proposedUnitNumber);
    setEditFloorId(item.targetFloorId);
    setEditCategoryId(item.targetCategoryId);
    setEditNetArea(item.proposedNetAreaSqft);
    setEditGrossArea(item.proposedGrossAreaSqft);
    setEditRate(item.proposedRatePerSqftPkr);
    setEditAdj(item.proposedPriceAdjustmentPkr || "0");
    setEditAdjReason(item.proposedPriceAdjustmentReason || "");
  }

  async function handleConfirmApprove() {
    if (!approvingItem) return;
    setBusy(true);
    try {
      const res = await approveUnitMerge({
        mergeRequestId: approvingItem.id,
        proposedUnitCode: editCode,
        proposedUnitNumber: editNumber,
        targetFloorId: editFloorId,
        targetCategoryId: editCategoryId,
        proposedNetAreaSqft: editNetArea,
        proposedGrossAreaSqft: editGrossArea,
        proposedRatePerSqftPkr: editRate,
        proposedPriceAdjustmentPkr: editAdj || "0",
        proposedPriceAdjustmentReason: editAdjReason || null,
      });
      toast.success(`Merge approved! Combined unit ${res.unitCode} created.`);
      setApprovingItem(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve merge");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingItem) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Please enter a rejection reason (at least 5 characters).");
      return;
    }
    setBusy(true);
    try {
      await rejectUnitMerge({
        mergeRequestId: rejectingItem.id,
        rejectionReason: rejectReason.trim(),
      });
      toast.success("Merge request rejected.");
      setRejectingItem(null);
      setRejectReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject merge");
    } finally {
      setBusy(false);
    }
  }

  const editPreviewPrice = React.useMemo(() => {
    try {
      if (!editGrossArea || !editRate) return "0.00";
      return computeTotalPrice(editRate, editGrossArea, editAdj || "0");
    } catch {
      return "0.00";
    }
  }, [editGrossArea, editRate, editAdj]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory" className="text-ink-muted hover:text-ink">
            <ArrowLeft weight="light" className="mr-1 size-3.5" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Unit Merge Requests"
        description="Review, edit pricing or restructuring details, verify proof documents, and approve or reject unit merges."
        actions={
          <Button variant="primary" size="md" asChild>
            <Link href={"/inventory/merge" as never}>
              <GitMerge weight="regular" className="mr-1.5 size-4" />
              New Merge
            </Link>
          </Button>
        }
      />

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => {
          const active = statusFilter === tab;
          const label =
            tab === "ALL"
              ? `All (${initialRequests.length})`
              : tab === "PENDING"
                ? `Pending Approval (${pendingCount})`
                : tab === "APPROVED"
                  ? "Approved"
                  : "Rejected";
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`h-8 rounded-[8px] border px-3 text-[12px] font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {visibleRequests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <GitMerge weight="light" className="mb-2 size-8 text-ink-faint" />
          <p className="text-[14px] font-medium text-ink">No merge requests found</p>
          <p className="mt-1 text-[12px] text-ink-muted">
            Start a merge from the Inventory page by clicking &ldquo;Merge Units&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRequests.map((req) => {
            const proposedPrice = computeTotalPrice(
              req.proposedRatePerSqftPkr,
              req.proposedGrossAreaSqft,
              req.proposedPriceAdjustmentPkr || "0",
            );
            return (
              <div key={req.id} className="card space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="unit-code font-sans text-[15px] font-semibold text-primary tabular-nums">
                        {formatUnitDisplayCode(
                          req.proposedUnitCode,
                          req.targetCategoryName,
                        )}
                      </span>
                      <Badge
                        tone={
                          req.status === "APPROVED"
                            ? "available"
                            : req.status === "REJECTED"
                              ? "sold"
                              : "accent"
                        }
                      >
                        {req.status}
                      </Badge>
                      <span className="text-[12px] text-ink-muted">
                        {req.targetFloorName} · {req.targetCategoryName}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-ink">
                      <span className="text-ink-muted">Reason:</span> {req.reason}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      Requested by {req.requestedByName ?? "Staff"} on{" "}
                      {new Date(req.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {req.reviewedByName && req.reviewedAt
                        ? ` · Reviewed by ${req.reviewedByName} on ${new Date(
                            req.reviewedAt,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                    {req.rejectionReason && (
                      <p className="mt-1 text-[12px] text-sold">
                        Rejection reason: {req.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {req.proofUrl && (
                      <Button variant="secondary" size="sm" asChild>
                        <a href={req.proofUrl} target="_blank" rel="noopener noreferrer">
                          <FileText weight="light" className="mr-1.5 size-3.5" />
                          {req.proofFileName || "Proof Document"}
                          <ArrowSquareOut weight="light" className="ml-1 size-3.5" />
                        </a>
                      </Button>
                    )}
                    {req.status === "APPROVED" && req.resultingUnitId && (
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/units/${req.resultingUnitId}` as never}>
                          Open Merged Unit
                        </Link>
                      </Button>
                    )}
                    {req.status === "PENDING" && isAdmin && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setRejectingItem(req);
                            setRejectReason("");
                          }}
                        >
                          <X weight="bold" className="mr-1 size-3.5 text-sold" />
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openApproveDialog(req)}
                        >
                          <Check weight="bold" className="mr-1 size-3.5" />
                          Review &amp; Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Source units + Combined unit specs */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-8">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                      Source Units ({req.sourceUnitsSnapshot.length})
                    </p>
                    <div className="overflow-x-auto rounded-[8px] border border-line">
                      <table className="w-full text-left text-[12px]">
                        <thead className="border-b border-line bg-[#F4F6F8] text-[11px] font-medium text-ink-muted">
                          <tr>
                            <th className="px-2.5 py-1.5">Code</th>
                            <th className="px-2.5 py-1.5">Floor / Cat</th>
                            <th className="px-2.5 py-1.5 text-right">Gross</th>
                            <th className="px-2.5 py-1.5 text-right">Net</th>
                            <th className="px-2.5 py-1.5 text-right">Rate</th>
                            <th className="px-2.5 py-1.5 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60">
                          {req.sourceUnitsSnapshot.map((s) => (
                            <tr key={s.id}>
                              <td className="unit-code px-2.5 py-1.5 font-sans font-medium text-ink tabular-nums">
                                {formatUnitDisplayCode(s.unitCode, s.categoryName)}
                              </td>
                              <td className="px-2.5 py-1.5 text-ink-muted">
                                {s.floorName} · {s.categoryName}
                              </td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums">
                                {formatSqft(
                                  effectivePricingArea(s.grossAreaSqft, s.netAreaSqft),
                                )}
                              </td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums">
                                {formatSqft(s.netAreaSqft)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums">
                                {formatPkrLedger(s.ratePerSqftPkr)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right font-medium tabular-nums">
                                {formatPkrLedger(s.computedPricePkr)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-[8px] border border-primary/20 bg-primary-soft/20 p-3.5 lg:col-span-4">
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-primary uppercase">
                      Combined Unit Proposal
                    </p>
                    <dl className="space-y-1 text-[12px]">
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Gross Area</dt>
                        <dd className="font-medium tabular-nums">
                          {formatSqft(req.proposedGrossAreaSqft)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Net Area</dt>
                        <dd className="tabular-nums">
                          {formatSqft(req.proposedNetAreaSqft)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Rate / sq ft</dt>
                        <dd className="tabular-nums">
                          {formatPkrLedger(req.proposedRatePerSqftPkr)}
                        </dd>
                      </div>
                      <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
                        <dt>Combined Price</dt>
                        <dd className="text-primary tabular-nums">
                          {formatPkrLedger(proposedPrice)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Review & Approve Dialog (editable before execution) */}
      <Dialog
        open={Boolean(approvingItem)}
        onOpenChange={(open) => !open && setApprovingItem(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review &amp; Approve Unit Merge</DialogTitle>
            <DialogDescription>
              Verify or adjust the restructured unit code, size, category, and rate before
              executing the merge atomically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-[12px]">Combined Unit Code</Label>
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                className="unit-code font-sans tabular-nums"
              />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Unit Number</Label>
              <Input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Target Floor</Label>
              <Select value={editFloorId} onValueChange={setEditFloorId}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label className="mb-1 block text-[12px]">Target Category</Label>
              <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label className="mb-1 block text-[12px]">Gross Area (sq ft)</Label>
              <Input
                value={editGrossArea}
                onChange={(e) => setEditGrossArea(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Net Area (sq ft)</Label>
              <Input
                value={editNetArea}
                onChange={(e) => setEditNetArea(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Rate / Sq. Ft. (PKR)</Label>
              <MoneyInput value={editRate} onValueChange={setEditRate} />
            </div>
            <div>
              <Label className="mb-1 block text-[12px]">Price Adjustment (PKR)</Label>
              <MoneyInput
                value={editAdj}
                allowNegative
                onValueChange={(v) => setEditAdj(v || "0")}
              />
            </div>
            {editAdj && editAdj !== "0" && editAdj !== "0.00" && (
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-[12px]">Adjustment Reason</Label>
                <Input
                  value={editAdjReason}
                  onChange={(e) => setEditAdjReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-[8px] border border-primary/20 bg-primary-soft/30 px-4 py-2.5 text-[13px]">
            <span className="text-ink-muted">Final Combined Unit Price</span>
            <span className="font-semibold text-primary tabular-nums">
              {formatPkrLedger(editPreviewPrice)}
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setApprovingItem(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmApprove} disabled={busy}>
              <Check weight="bold" className="mr-1.5 size-4" />
              {busy ? "Approving…" : "Approve & Execute Merge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={Boolean(rejectingItem)}
        onOpenChange={(open) => !open && setRejectingItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Merge Request</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting merge request{" "}
              <span className="unit-code font-sans font-semibold text-ink tabular-nums">
                {rejectingItem?.proposedUnitCode}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-1 block text-[12px]">Rejection Reason *</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this merge cannot be approved…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setRejectingItem(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReject} disabled={busy}>
              {busy ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
