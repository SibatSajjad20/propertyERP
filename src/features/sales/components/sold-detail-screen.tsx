/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUUpLeft, FileText, Printer } from "@phosphor-icons/react";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { DefinitionList, DefinitionRow } from "@/components/ui/definition-list";
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
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type { UserRole, PaymentMethod } from "@/db/schema/enums";
import { DocumentsSection } from "@/features/documents/components/documents-section";
import { PdfDownloadBar } from "@/features/documents/components/pdf-download-bar";
import { DownPaymentReceiptButton } from "@/features/documents/components/down-payment-receipt-button";
import { buybackSale } from "../actions";
import { calculateBuyback } from "../calculator";
import { PrintableReceiptDialog } from "./printable-documents";

interface SoldDetailScreenProps {
  data: any;
  role: UserRole;
  signatories?: Array<{ id: string; name: string; designation: string }>;
}

export function SoldDetailScreen({
  data,
  role,
  signatories = [],
}: SoldDetailScreenProps) {
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
  const clientId = isDirect ? data.data.clientId : data.data.booking.clientId;
  const kin = isDirect ? data.data.nextOfKin : data.data.nextOfKin;
  const documents = isDirect ? data.data.documents : data.data.documents;

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
    <div className="flex min-h-0 flex-1 flex-col space-y-5 pb-16">
      <PageHeader
        back={{ href: "/sold", label: "Sold Units" }}
        idTitle={true}
        title={item.unitCode}
        badge={
          <Pill tone={isBoughtBack ? "muted" : "sold"}>
            {isBoughtBack ? "Bought Back (Available)" : "Sold"}
          </Pill>
        }
        description={`Serial ${item.serialNo} · ${item.applicationFormNo} · ${item.registrationNo}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PdfDownloadBar
              href={`/api/documents/sale/${isDirect ? data.data.id : data.data.booking.id}/pdf`}
              printLabel="Print"
            />
            <DownPaymentReceiptButton
              href={
                isDirect
                  ? `/api/documents/sale/${data.data.id}/receipt.pdf`
                  : `/api/documents/booking/${data.data.booking.id}/receipt.pdf`
              }
              signatories={signatories}
              hasPayments={
                isDirect
                  ? true
                  : (data.data.payments ?? []).some(
                      (p: { isVoided?: boolean }) => !p.isVoided,
                    )
              }
            />
            <Button
              variant="secondary"
              size="md"
              asChild
              className="gap-1.5 text-[13px] font-medium"
            >
              <Link
                href={
                  (isDirect
                    ? `/agreements?saleId=${data.data.id}`
                    : `/agreements?bookingId=${data.data.booking.id}`) as never
                }
              >
                <FileText weight="light" className="size-4" />
                Agreement
              </Link>
            </Button>

            {!isBoughtBack && isAdmin && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setBuybackOpen(true)}
                className="gap-1.5 text-[13px] font-medium text-sold hover:bg-sold/10"
              >
                <ArrowUUpLeft weight="bold" className="size-4" />
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
        }
      />

      {/* Financial StatStrip */}
      <StatStrip columns={3}>
        <StatCell
          label="Realized Sale"
          value={formatPkr(originalPrice)}
          subLine={`Sold on ${new Date(isDirect ? item.soldAt : item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
          valueClassName="text-sold"
        />
        <StatCell
          label="Sale Type"
          value={isDirect ? "Direct Sale" : "Completed Booking"}
          subLine={
            isBoughtBack ? "Status: Bought Back (Available)" : "Status: Active Ownership"
          }
        />
        <StatCell
          label="Unit Area"
          value={`${effectivePricingArea(item.grossAreaSqft, item.netAreaSqft)} sq ft`}
          subLine={`${item.floorName} · ${item.blockName} · ${item.categoryName}`}
        />
      </StatStrip>

      {/* Two-Column Buyer & Unit Definition Panels */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Panel
          title="Registered Buyer"
          hint="Primary purchaser recorded in sales register"
        >
          <DefinitionList>
            <DefinitionRow label="Full Name" value={item.clientName} />
            <DefinitionRow label="National ID (CNIC)" value={item.clientCnic} />
            <DefinitionRow label="Mobile Phone" value={item.clientPhone} />
            <DefinitionRow label="Residential Address" value={item.homeAddress} />
          </DefinitionList>
        </Panel>

        <Panel
          title="Property Unit"
          hint="Physical commercial space specification"
          actions={
            <Link
              href={`/units/${item.unitId}`}
              className="unit-code font-sans text-[12px] font-semibold text-primary hover:underline"
            >
              View Unit Details →
            </Link>
          }
        >
          <DefinitionList>
            <DefinitionRow
              label="Unit Code"
              value={formatUnitDisplayCode(item.unitCode, item.categoryName)}
            />
            <DefinitionRow
              label="Floor & Block"
              value={`${item.floorName} · ${item.blockName}`}
            />
            <DefinitionRow label="Category" value={item.categoryName} />
            <DefinitionRow
              label="Gross Area"
              value={`${effectivePricingArea(item.grossAreaSqft, item.netAreaSqft)} sq ft`}
            />
          </DefinitionList>
        </Panel>
      </div>

      {/* Official Buyback Record if present */}
      {buybackRecord && (
        <Panel
          title="Official Buyback Record"
          hint={`Approved by ${buybackRecord.approvedByName || "Admin"}`}
        >
          <div className="space-y-4">
            <DefinitionList>
              <DefinitionRow
                label="Original Sale Price"
                value={formatPkr(buybackRecord.originalPrice)}
              />
              <DefinitionRow
                label="Buyback Amount Paid"
                value={formatPkr(buybackRecord.buybackAmount)}
              />
              <DefinitionRow
                label="Settlement Date"
                value={new Date(buybackRecord.paidAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <DefinitionRow
                label="Settlement Method"
                value={`${buybackRecord.method}${buybackRecord.bank ? ` (${buybackRecord.bank})` : ""}`}
              />
              <DefinitionRow
                label="Approval Justification"
                value={buybackRecord.reason}
              />
            </DefinitionList>
          </div>
        </Panel>
      )}

      {/* Documents Section */}
      <Panel title="Associated Documents" hint="Identity and ownership records">
        <DocumentsSection
          clientId={clientId}
          kinId={kin?.id ?? null}
          documents={documents ?? []}
          initialUrls={isDirect ? data.data.signedUrls : data.data.signedUrls}
          urlKey={isDirect ? data.data.id : data.data.booking.id}
          role={role}
          replacePermission="sales.create"
        />
      </Panel>

      {/* Buyback Dialog with Live Gain/Loss preview */}
      <Dialog open={buybackOpen} onOpenChange={setBuybackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Unit Buyback &amp; Reacquisition</DialogTitle>
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
                Buyback Reason &amp; Approval Note{" "}
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
