/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUUpLeft,
  DotsThree,
  DownloadSimple,
  FileText,
  Printer,
  Receipt,
} from "@phosphor-icons/react";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { DefinitionList, DefinitionRow } from "@/components/ui/definition-list";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { DatePicker } from "@/components/ui/date-picker";
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type { UserRole, PaymentMethod } from "@/db/schema/enums";
import { DocumentsSection } from "@/features/documents/components/documents-section";
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
  const [activeTab, setActiveTab] = React.useState("overview");
  const [buybackOpen, setBuybackOpen] = React.useState(false);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [downPaymentModalOpen, setDownPaymentModalOpen] = React.useState(false);
  const [selectedSignatoryId, setSelectedSignatoryId] = React.useState(
    signatories[0]?.id ?? "",
  );
  const [appendix, setAppendix] = React.useState(true);

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
  const installments = !isDirect ? (data.data.installments ?? []) : [];
  const payments = !isDirect ? (data.data.payments ?? []) : [];

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

  const targetId = isDirect ? data.data.id : data.data.booking.id;
  const basePdfUrl = `/api/documents/sale/${targetId}/pdf`;
  const pdfViewUrl = `${basePdfUrl}${appendix ? "?appendix=1" : ""}`;
  const pdfDownloadUrl = `${basePdfUrl}?download=1${appendix ? "&appendix=1" : ""}`;
  const downPaymentBaseUrl = isDirect
    ? `/api/documents/sale/${data.data.id}/receipt.pdf`
    : `/api/documents/booking/${data.data.booking.id}/receipt.pdf`;
  const agreementUrl = isDirect
    ? `/agreements/new?saleId=${data.data.id}`
    : `/agreements/new?bookingId=${data.data.booking.id}`;

  const hasPaymentReceipt = isDirect
    ? true
    : payments.some((p: { isVoided?: boolean }) => !p.isVoided);

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
      {/* Header bar designed identically to Booking Detail Screen */}
      <PageHeader
        back={{ href: "/sold", label: "Sold Units" }}
        idTitle={true}
        title={item.unitCode}
        badge={
          <Pill tone={isBoughtBack ? "muted" : "sold"}>
            {isBoughtBack ? "Bought Back (Available)" : "Sold"}
          </Pill>
        }
        meta={[
          `Serial #${item.serialNo}`,
          item.applicationFormNo,
          `Unit ${item.unitCode}`,
          `Sold ${new Date(isDirect ? item.soldAt : item.createdAt).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
          )}`,
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="md" className="gap-1.5">
                  <DotsThree weight="bold" className="size-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href={pdfViewUrl} target="_blank" rel="noopener noreferrer">
                    <Printer weight="light" className="mr-2 size-4 text-ink-muted" />
                    Print
                  </a>
                </DropdownMenuItem>

                <DropdownMenuCheckboxItem
                  checked={appendix}
                  onCheckedChange={setAppendix}
                >
                  Include CNIC appendix
                </DropdownMenuCheckboxItem>

                <DropdownMenuItem
                  onClick={() => setDownPaymentModalOpen(true)}
                  disabled={!hasPaymentReceipt}
                >
                  <Receipt weight="light" className="mr-2 size-4 text-ink-muted" />
                  Down payment receipt
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href={agreementUrl as never}>
                    <FileText weight="light" className="mr-2 size-4 text-ink-muted" />
                    Agreement
                  </Link>
                </DropdownMenuItem>

                {buybackRecord && (
                  <DropdownMenuItem onClick={() => setReceiptOpen(true)}>
                    <Printer weight="light" className="mr-2 size-4 text-ink-muted" />
                    Buyback Receipt
                  </DropdownMenuItem>
                )}

                {!isBoughtBack && isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="danger"
                      onClick={() => setBuybackOpen(true)}
                    >
                      <ArrowUUpLeft weight="light" className="mr-2 size-4 text-sold" />
                      Unit Buyback
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Download PDF button */}
            <Button variant="secondary" size="md" asChild className="gap-1.5">
              <a href={pdfDownloadUrl} download>
                <DownloadSimple weight="light" className="size-4" />
                Download PDF
              </a>
            </Button>

            {/* Buyback button */}
            {!isBoughtBack && isAdmin && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setBuybackOpen(true)}
                className="gap-1.5 text-sold hover:bg-sold/10"
              >
                <ArrowUUpLeft weight="bold" className="size-4" />
                Unit Buyback
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
          subLine={`Sold on ${new Date(
            isDirect ? item.soldAt : item.createdAt,
          ).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`}
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

      {/* Navigation Tabs matching Booking Detail Screen */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="border-b border-line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {installments.length > 0 && (
            <TabsTrigger value="schedule">
              Payment schedule ({installments.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="documents">
            Documents ({documents?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
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
          </div>

          {/* Next of Kin if present */}
          {kin && (
            <Panel title="Nominee / Next of Kin" hint="Recorded beneficiary details">
              <DefinitionList>
                <DefinitionRow label="Full Name" value={kin.name} />
                <DefinitionRow
                  label="Relationship"
                  value={`${kin.relationPrefix ?? "S/O"} ${kin.relationName ?? ""} (${kin.relation ?? "Nominee"})`}
                />
                <DefinitionRow label="CNIC" value={kin.cnic || "—"} />
                <DefinitionRow label="Phone" value={kin.phone || "—"} />
              </DefinitionList>
            </Panel>
          )}

          {/* Official Buyback Record if present */}
          {buybackRecord && (
            <Panel
              title="Official Buyback Record"
              hint={`Approved by ${buybackRecord.approvedByName || "Admin"}`}
            >
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
            </Panel>
          )}
        </TabsContent>

        {/* 2. Schedule Tab (if booking has installments) */}
        {installments.length > 0 && (
          <TabsContent value="schedule" className="space-y-6">
            <Panel
              title="Completed Payment Schedule"
              hint={`${installments.length} installments settled`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line bg-subtle/40 text-[11px] font-semibold text-ink-muted uppercase">
                      <th className="px-3 py-2 text-center">Seq</th>
                      <th className="px-4 py-2">Due Date</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-right">Paid</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {installments.map((inst: any) => (
                      <tr key={inst.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-center text-ink-muted tabular-nums">
                          #{inst.seq}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {new Date(inst.dueDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatPkr(inst.amount)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-available tabular-nums">
                          {formatPkr(inst.paidAmount)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">
                          {formatPkr(inst.balance)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Pill tone="available" className="text-[10px]">
                            {inst.status}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </TabsContent>
        )}

        {/* 3. Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentsSection
            clientId={clientId}
            kinId={kin?.id ?? null}
            documents={documents ?? []}
            initialUrls={data.signedUrls ?? []}
            urlKey={isDirect ? data.data.id : data.data.booking.id}
            role={role}
            replacePermission="sales.create"
          />
        </TabsContent>
      </Tabs>

      {/* Down Payment Receipt Signatory Dialog */}
      <Dialog open={downPaymentModalOpen} onOpenChange={setDownPaymentModalOpen}>
        <DialogContent className="max-w-md rounded-[16px]">
          <DialogHeader>
            <DialogTitle>Download down payment receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="mb-1 block text-[12px]">Authorized signatory</Label>
            <Select value={selectedSignatoryId} onValueChange={setSelectedSignatoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select signatory" />
              </SelectTrigger>
              <SelectContent>
                {signatories.map((sig) => (
                  <SelectItem key={sig.id} value={sig.id}>
                    {sig.name} ({sig.designation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDownPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" asChild>
              <a
                href={`${downPaymentBaseUrl}${selectedSignatoryId ? `?signatoryId=${selectedSignatoryId}` : ""}`}
                download
                onClick={() => setDownPaymentModalOpen(false)}
              >
                Download PDF
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buyback Dialog with Live Gain/Loss preview & DatePicker */}
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
                <DatePicker value={paidAt} onChange={(val) => setPaidAt(val)} />
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
