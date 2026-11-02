/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUUpLeft,
  CheckCircle,
  CurrencyDollar,
  HandCoins,
  Printer,
  Tag,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type { UserRole, PaymentMethod } from "@/db/schema/enums";
import { buybackSale } from "../actions";
import { calculateBuyback } from "../calculator";
import { PrintableReceiptDialog } from "./printable-documents";

interface SoldDetailScreenProps {
  data: any;
  role: UserRole;
}

export function SoldDetailScreen({ data, role }: SoldDetailScreenProps) {
  const router = useRouter();
  const [buybackOpen, setBuybackOpen] = React.useState(false);
  const [receiptOpen, setReceiptOpen] = React.useState(false);

  // Buyback form fields
  const [buybackAmount, setBuybackAmount] = React.useState("");
  const [buybackMethod, setBuybackMethod] = React.useState<PaymentMethod>("CHEQUE");
  const [chequeNo, setChequeNo] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isDirect = data.type === "DIRECT_SALE";
  const item = isDirect ? data.data : data.data.booking;
  const buybackRecord = data.buyback;

  const originalPrice = isDirect ? item.salePrice : item.netPrice;
  const isBoughtBack = item.status === "BOUGHT_BACK" || Boolean(buybackRecord);

  // Initialize default buyback amount to original sale price
  React.useEffect(() => {
    if (!buybackAmount && originalPrice) {
      setBuybackAmount(originalPrice);
    }
  }, [buybackAmount, originalPrice]);

  // Live calculation of Gain / Loss for Sardar's Mall
  const buybackCalc = React.useMemo(() => {
    if (!buybackAmount) return null;
    return calculateBuyback({
      originalPricePkr: originalPrice,
      buybackAmountPkr: buybackAmount,
    });
  }, [originalPrice, buybackAmount]);

  const isAdmin = role === "ADMIN";

  async function handleConfirmBuyback() {
    if (!buybackAmount || Number(buybackAmount) <= 0) {
      toast.error("Please enter a valid buyback amount");
      return;
    }
    if (!reason || reason.trim().length < 10) {
      toast.error("Please enter an approval reason of at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await buybackSale({
        unitId: item.unitId,
        saleId: isDirect ? item.id : undefined,
        bookingId: !isDirect ? item.id : undefined,
        buybackAmountPkr: buybackAmount,
        method: buybackMethod,
        chequeNo: chequeNo || undefined,
        bank: bank || undefined,
        paidAt,
        reason,
      });

      toast.success("Unit buyback recorded. Unit is now Available.");
      setBuybackOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to process buyback");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href={"/sold" as never}>
              <ArrowLeft weight="light" className="mr-1 size-3.5" />
              Sold Units
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="unit-code font-mono text-[18px] font-bold text-sold">
                {item.unitCode}
              </span>
              <Badge tone={isBoughtBack ? "muted" : "sold"}>
                {isBoughtBack ? "Bought Back (Available)" : "Sold"}
              </Badge>
            </div>
            <p className="text-[12px] text-ink-muted">
              {isDirect ? "Direct Sale" : `Booking ${item.bookingNo}`} · Buyer:{" "}
              {item.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isBoughtBack && isAdmin && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setBuybackOpen(true)}
              className="gap-1.5 text-accent hover:bg-accent/10"
            >
              <ArrowUUpLeft weight="light" className="size-4" />
              Unit Buyback
            </Button>
          )}

          {buybackRecord && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setReceiptOpen(true)}
              className="gap-1.5"
            >
              <Printer weight="light" className="size-4" />
              Buyback Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Cards: Unit Details, Ownership, Sale Settlement */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Unit Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[13px] font-semibold text-ink">Property Unit</h4>
            <Link
              href={`/units/${item.unitId}`}
              className="unit-code font-mono text-[13px] font-bold text-primary hover:underline"
            >
              {item.unitCode}
            </Link>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Floor & Block:</span>
              <span className="font-medium text-ink">
                {item.floorName} · {item.blockName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Category:</span>
              <span className="font-medium text-ink">{item.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Net Area:</span>
              <span className="font-medium text-ink tabular-nums">
                {item.netAreaSqft} sq ft
              </span>
            </div>
          </div>
        </div>

        {/* Client Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[13px] font-semibold text-ink">Registered Buyer</h4>
            <span className="font-mono text-[11px] text-ink-muted">
              {item.clientCnic}
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Name:</span>
              <span className="font-medium text-ink">{item.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Phone:</span>
              <span className="font-medium text-ink tabular-nums">
                {item.clientPhone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Address:</span>
              <span className="max-w-[160px] truncate text-ink-muted">
                {item.homeAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Sale Financials Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[13px] font-semibold text-ink">Realized Sale</h4>
            <span className="font-bold text-sold tabular-nums">
              {formatPkr(originalPrice)}
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Date Sold:</span>
              <span className="font-sans text-ink tabular-nums">
                {new Date(isDirect ? item.soldAt : item.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Sale Type:</span>
              <span className="font-medium text-ink">
                {isDirect ? "Direct Sale" : "Completed Booking"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Current Status:</span>
              <span className="font-semibold text-ink">
                {isBoughtBack ? "Bought Back" : "Active Ownership"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buyback History Banner if present */}
      {buybackRecord && (
        <div className="card space-y-3 border-accent/30 bg-accent/5 p-5">
          <div className="flex items-center justify-between border-b border-accent/20 pb-2">
            <h4 className="text-[14px] font-semibold text-accent">
              Official Buyback Record
            </h4>
            <span className="text-[12px] text-ink-muted">
              Approved by {buybackRecord.approvedByName || "Admin"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[12px] sm:grid-cols-4">
            <div>
              <span className="text-ink-muted">Original Sale Price:</span>
              <p className="font-bold text-ink tabular-nums">
                {formatPkr(buybackRecord.originalPrice)}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Buyback Amount Paid:</span>
              <p className="font-bold text-accent tabular-nums">
                {formatPkr(buybackRecord.buybackAmount)}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Settlement Date:</span>
              <p className="font-sans text-ink tabular-nums">
                {new Date(buybackRecord.paidAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Settlement Method:</span>
              <p className="font-medium text-ink">{buybackRecord.method}</p>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-ink-muted">Reason / Justification:</span>
            <p className="text-[12px] text-ink italic">{buybackRecord.reason}</p>
          </div>
        </div>
      )}

      {/* Buyback Dialog with Live Gain/Loss preview */}
      <Dialog open={buybackOpen} onOpenChange={setBuybackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Unit Buyback & Reacquisition</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-[13px]">
            <p className="text-[12px] text-ink-muted">
              Reacquiring unit {item.unitCode} will return it to Available status, while
              preserving full prior ownership and valuation history.
            </p>

            <div className="rounded-[8px] bg-subtle/60 p-3">
              <span className="block text-[11px] text-ink-muted uppercase">
                Original Sale Price
              </span>
              <span className="text-[16px] font-bold text-ink tabular-nums">
                {formatPkr(originalPrice)}
              </span>
            </div>

            <div>
              <Label className="text-[12px]">
                Agreed Buyback Amount (PKR) <span className="text-sold">*</span>
              </Label>
              <MoneyInput
                value={buybackAmount}
                onChange={(e) => setBuybackAmount(e.target.value)}
                placeholder="e.g. 26,00,000"
                className="font-bold tabular-nums"
                autoFocus
              />
            </div>

            {/* Live Difference / Gain / Loss Preview */}
            {buybackCalc && (
              <div
                className={cn(
                  "flex items-center justify-between rounded-[8px] border p-3",
                  buybackCalc.isGain
                    ? "border-available/30 bg-available/5 text-available"
                    : "border-sold/30 bg-sold/5 text-sold",
                )}
              >
                <div>
                  <span className="block text-[11px] font-semibold uppercase">
                    {buybackCalc.isGain
                      ? "Gain for Sardar's Mall"
                      : "Loss / Premium Paid"}
                  </span>
                  <span className="text-[16px] font-bold tabular-nums">
                    {buybackCalc.isGain ? "+" : "-"}{" "}
                    {formatPkr(buybackCalc.differencePkr)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-ink-muted">
                  vs. Original Sale ({formatPkr(originalPrice)})
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px]">Payment Method</Label>
                <Select
                  value={buybackMethod}
                  onValueChange={(val) => setBuybackMethod(val as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHEQUE">Crossed Cheque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      Bank Transfer / Pay Order
                    </SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[12px]">Instrument / Cheque No</Label>
                <Input
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  placeholder="e.g. 987654"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px]">Bank Name</Label>
                <Input
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="e.g. MCB Bank"
                />
              </div>
              <div>
                <Label className="text-[12px]">Settlement Date</Label>
                <Input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyback-reason" className="text-[12px]">
                Buyback Reason & Approval Note{" "}
                <span className="text-sold">* (min 10 chars)</span>
              </Label>
              <Input
                id="buyback-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Investor liquidating portfolio, repurchased for commercial holding"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setBuybackOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmBuyback}
              disabled={isSubmitting || reason.trim().length < 10}
              className="bg-accent hover:bg-accent/90"
            >
              {isSubmitting ? "Processing Buyback..." : "Confirm Buyback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Buyback Receipt */}
      {buybackRecord && (
        <PrintableReceiptDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          receipt={{
            receiptNo: `BB-${item.unitCode}`,
            paidAt: buybackRecord.paidAt,
            clientName: item.clientName,
            clientCnic: item.clientCnic,
            clientPhone: item.clientPhone,
            unitCode: item.unitCode,
            amountPkr: buybackRecord.buybackAmount,
            method: buybackRecord.method,
            chequeNo: buybackRecord.chequeNo,
            bank: buybackRecord.bank,
            receivedByName: buybackRecord.approvedByName,
            notes: `Buyback settlement: ${buybackRecord.reason}`,
          }}
        />
      )}
    </div>
  );
}
