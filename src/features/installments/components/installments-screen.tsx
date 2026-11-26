"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlass,
  Coins,
  CalendarDots,
  PencilSimple,
  Prohibit,
  Printer,
  User,
  ArrowRight,
  X,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { Badge, Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatPkr } from "@/lib/money";
import type { UserRole } from "@/db/schema/enums";
import type { ClientProfileWithBookings, DueThisWeekSummary } from "../queries";
import { getClientProfileAction, searchClientsAction } from "../actions";
import { DueThisWeekCard } from "./due-this-week-card";
import { EditPaymentDialog, type EditPaymentDialogProps } from "./edit-payment-dialog";
import {
  PaymentReceiptDialog,
  type PrintableReceiptData,
} from "./payment-receipt-dialog";
import { VoidPaymentDialog, type VoidPaymentDialogProps } from "./void-payment-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { RescheduleDialog } from "./reschedule-dialog";

export interface InstallmentsScreenProps {
  initialSummary: DueThisWeekSummary;
  initialProfile: ClientProfileWithBookings | null;
  initialQuery?: string;
  userRole: UserRole;
}

function autoFormatCnic(val: string): string {
  if (/^[a-zA-Z]/.test(val)) return val;
  const digits = val.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function InstallmentsScreen({
  initialSummary,
  initialProfile,
  initialQuery = "",
  userRole,
}: InstallmentsScreenProps) {
  const router = useRouter();

  const [searchVal, setSearchVal] = React.useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = React.useState(initialQuery);
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(
    initialProfile?.client.id || null,
  );
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(
    initialProfile?.bookings[0]?.id || null,
  );

  // Modal states
  const [recordModalOpen, setRecordModalOpen] = React.useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = React.useState(false);
  const [editPaymentModalOpen, setEditPaymentModalOpen] = React.useState(false);
  const [voidPaymentModalOpen, setVoidPaymentModalOpen] = React.useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = React.useState(false);

  // Active target objects for modals
  const [activeReceipt, setActiveReceipt] = React.useState<PrintableReceiptData | null>(
    null,
  );
  const [activePaymentForEdit, setActivePaymentForEdit] =
    React.useState<EditPaymentDialogProps["payment"]>(null);
  const [activePaymentForVoid, setActivePaymentForVoid] =
    React.useState<VoidPaymentDialogProps["payment"]>(null);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(searchVal.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Instant client search via TanStack Query
  const { data: searchResults = [] } = useQuery({
    queryKey: ["installments-search", debouncedQ],
    queryFn: () => searchClientsAction(debouncedQ),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  // Fetch client details when selected
  const { data: clientProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["client-profile-bookings", selectedClientId],
    queryFn: () => (selectedClientId ? getClientProfileAction(selectedClientId) : null),
    enabled: !!selectedClientId,
    initialData:
      initialProfile?.client.id === selectedClientId ? initialProfile : undefined,
  });

  // Selected booking object
  const currentBooking = React.useMemo(() => {
    if (!clientProfile || clientProfile.bookings.length === 0) return null;
    if (!selectedBookingId) return clientProfile.bookings[0] ?? null;
    return (
      clientProfile.bookings.find((b) => b.id === selectedBookingId) ??
      clientProfile.bookings[0] ??
      null
    );
  }, [clientProfile, selectedBookingId]);

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const formatted = autoFormatCnic(val);
    setSearchVal(formatted);
  }

  function handleSelectClient(id: string) {
    setSelectedClientId(id);
    setSelectedBookingId(null);
    router.push(`/installments?clientId=${id}` as never);
  }

  function handleQuickDueBookingSelect(bookingId: string) {
    setSearchVal(bookingId);
    setDebouncedQ(bookingId);
  }

  function handlePaymentRecorded(receipt: PrintableReceiptData) {
    setActiveReceipt(receipt);
    setReceiptModalOpen(true);
    refetchProfile();
  }

  function handleOpenPdf() {
    if (!currentBooking) return;
    const url = `/api/documents/installments/booking/${currentBooking.id}/pdf`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col gap-6 select-none print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Installments &amp; Collections"
          meta={[
            `${initialSummary.dueThisWeekCount} due this week`,
            initialSummary.overdueCount > 0
              ? `${initialSummary.overdueCount} overdue`
              : "0 overdue",
          ]}
        />
      </div>

      {/* Big Search Bar with Instant Results */}
      <Panel className="relative p-3.5 print:hidden">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            Customer &amp; Booking Lookup
          </label>
          {selectedClientId && clientProfile && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">Active Client:</span>
              <Pill tone="primary" className="gap-1.5 py-0.5 pr-1 pl-2">
                <span>{clientProfile.client.fullName}</span>
                <span className="tabular-nums">({clientProfile.client.cnic})</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId(null);
                    setSearchVal("");
                  }}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X weight="bold" className="size-3" />
                </button>
              </Pill>
            </div>
          )}
        </div>

        <div className="relative">
          <MagnifyingGlass
            weight="light"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchInputChange}
            placeholder="Search by Client Name, CNIC (12345-1234567-1), Phone, Booking #, or Unit Code…"
            className="h-10 w-full rounded-[8px] border border-line bg-surface pr-4 pl-9 font-sans text-[13px] text-ink shadow-xs placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
        </div>

        {/* Instant Search Results Dropdown */}
        {debouncedQ.length >= 2 && searchResults.length > 0 && (
          <div className="mt-2.5 max-h-64 overflow-y-auto rounded-[8px] border border-line bg-surface p-1.5 shadow-floating">
            <span className="px-2 py-1 text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
              Matching Records ({searchResults.length})
            </span>
            <div className="mt-1 flex flex-col gap-1">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectClient(result.id)}
                  className="flex cursor-pointer items-center justify-between rounded-[6px] p-2 text-left transition-colors hover:bg-subtle"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User weight="bold" className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-ink">
                        {result.fullName}
                      </p>
                      <p className="font-sans text-[11px] text-ink-muted tabular-nums">
                        CNIC: {result.cnic} · Phone: {result.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.bookings.map((b) => (
                      <Badge
                        key={b.id}
                        tone="muted"
                        className="font-sans text-[10px] tabular-nums"
                      >
                        {b.unitCode} ({b.bookingNo})
                      </Badge>
                    ))}
                    <ArrowRight weight="bold" className="size-3.5 text-ink-muted" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* When NO Client is selected: show Due This Week full width */}
      {!selectedClientId && (
        <DueThisWeekCard
          summary={initialSummary}
          onSelectBooking={handleQuickDueBookingSelect}
        />
      )}

      {/* When Client IS selected: 2-column layout */}
      {selectedClientId && clientProfile && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Column (8 cols): Client details, Bookings, Schedule & Payments */}
          <div className="space-y-6 lg:col-span-8">
            {/* Client Header Card */}
            <Panel className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
                    {clientProfile.client.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[16px] font-bold text-ink">
                        {clientProfile.client.fullName}
                      </h2>
                      <span className="font-sans text-[12px] text-ink-muted tabular-nums">
                        CNIC: {clientProfile.client.cnic}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[12px] text-ink-muted">
                      <span>
                        Phone:{" "}
                        <strong className="text-ink tabular-nums">
                          {clientProfile.client.phone}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>{clientProfile.client.homeAddress}</span>
                    </div>
                  </div>
                </div>

                {currentBooking && (
                  <div className="flex items-center gap-2">
                    {userRole === "ADMIN" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRescheduleModalOpen(true)}
                        className="gap-1.5"
                      >
                        <CalendarDots weight="light" className="size-3.5" />
                        Reschedule
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setRecordModalOpen(true)}
                      className="gap-1.5"
                    >
                      <Coins weight="bold" className="size-3.5" />
                      Record payment
                    </Button>
                  </div>
                )}
              </div>
            </Panel>

            {/* Bookings Selector Tabs if multiple */}
            {clientProfile.bookings.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[12px] font-medium text-ink-muted">Bookings:</span>
                {clientProfile.bookings.map((b) => {
                  const active = b.id === currentBooking?.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBookingId(b.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors",
                        active
                          ? "bg-primary text-white"
                          : "bg-subtle text-ink-muted hover:bg-subtle/80 hover:text-ink",
                      )}
                    >
                      <span className="unit-code font-sans tabular-nums">
                        {b.unit.unitCode}
                      </span>
                      <span className="font-sans tabular-nums">({b.bookingNo})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Booking Overview & Tables */}
            {currentBooking ? (
              <div className="space-y-6">
                {/* 4-Cell Mini StatStrip */}
                <StatStrip columns={4}>
                  <StatCell
                    label="CONTRACT PRICE"
                    value={formatPkr(currentBooking.netPrice)}
                    subLine={`Unit ${currentBooking.unit.unitCode}`}
                  />
                  <StatCell
                    label="TOTAL PAID"
                    value={formatPkr(currentBooking.paidTotal)}
                    subLine={`${currentBooking.paidPercent}% paid`}
                    progress={Number(currentBooking.paidPercent) || 0}
                  />
                  <StatCell
                    label="REMAINING"
                    value={formatPkr(currentBooking.balance)}
                    subLine={`Plan: ${currentBooking.plan.toLowerCase()}`}
                  />
                  <StatCell
                    label="OVERDUE"
                    value={
                      currentBooking.overdueAmount !== "0.00" ? (
                        <span className="text-sold">
                          {formatPkr(currentBooking.overdueAmount)}
                        </span>
                      ) : (
                        <span className="text-available">Up to date</span>
                      )
                    }
                    subLine={
                      currentBooking.overdueAmount !== "0.00"
                        ? "Past due balance"
                        : "All current"
                    }
                  />
                </StatStrip>

                {/* Schedule & Payment History Tabs */}
                <Tabs defaultValue="schedule" className="w-full space-y-4">
                  <div className="flex items-center justify-between border-b border-line">
                    <TabsList>
                      <TabsTrigger value="schedule">
                        Installment Schedule ({currentBooking.schedule.length})
                      </TabsTrigger>
                      <TabsTrigger value="payments">
                        Payment History ({currentBooking.payments.length})
                      </TabsTrigger>
                    </TabsList>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenPdf}
                      className="gap-1.5 text-[12px] text-ink-muted"
                    >
                      <Printer weight="light" className="size-3.5" />
                      Print / PDF
                    </Button>
                  </div>

                  {/* Schedule Table Tab */}
                  <TabsContent value="schedule" className="m-0">
                    <Panel className="overflow-hidden p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left font-sans text-[12.5px]">
                          <thead>
                            <tr className="h-[38px] border-b border-line bg-[#FAFBFC] text-[11px] font-medium text-ink-muted uppercase">
                              <th className="w-12 px-3 text-center font-medium">Seq</th>
                              <th className="px-4 font-medium">Due Date</th>
                              <th className="px-4 text-right font-medium">Amount</th>
                              <th className="px-4 text-right font-medium">Paid</th>
                              <th className="px-4 text-right font-medium">Balance</th>
                              <th className="px-4 font-medium">Receipt #</th>
                              <th className="px-4 text-center font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/60">
                            {currentBooking.schedule.map((inst) => {
                              const isOverdue = inst.status === "OVERDUE";
                              return (
                                <tr
                                  key={inst.id}
                                  className={cn(
                                    "h-[44px] transition-colors hover:bg-subtle/30",
                                    isOverdue && "bg-sold/5",
                                  )}
                                >
                                  <td className="px-3 text-center text-ink-muted tabular-nums">
                                    #{inst.seq}
                                  </td>
                                  <td className="px-4 tabular-nums">
                                    <span
                                      className={
                                        isOverdue ? "font-semibold text-sold" : "text-ink"
                                      }
                                    >
                                      {new Date(inst.dueDate).toLocaleDateString(
                                        "en-GB",
                                        {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 text-right text-ink tabular-nums">
                                    {formatPkr(inst.amount)}
                                  </td>
                                  <td className="px-4 text-right font-medium text-available tabular-nums">
                                    {formatPkr(inst.paidAmount)}
                                  </td>
                                  <td className="px-4 text-right font-semibold text-ink tabular-nums">
                                    {formatPkr(inst.balance)}
                                  </td>
                                  <td className="px-4 text-[11px] text-primary tabular-nums">
                                    {inst.receiptNos || "—"}
                                  </td>
                                  <td className="px-4 text-center">
                                    <Badge
                                      tone={
                                        inst.status === "PAID"
                                          ? "available"
                                          : inst.status === "PARTIAL"
                                            ? "accent"
                                            : inst.status === "OVERDUE"
                                              ? "sold"
                                              : "muted"
                                      }
                                    >
                                      {inst.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  </TabsContent>

                  {/* Payment History Tab */}
                  <TabsContent value="payments" className="m-0">
                    <Panel className="overflow-hidden p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left font-sans text-[12.5px]">
                          <thead>
                            <tr className="h-[38px] border-b border-line bg-[#FAFBFC] text-[11px] font-medium text-ink-muted uppercase">
                              <th className="px-4 font-medium">Receipt #</th>
                              <th className="px-3 font-medium">Payment Date</th>
                              <th className="px-3 text-right font-medium">Amount</th>
                              <th className="px-3 font-medium">Method</th>
                              <th className="px-3 font-medium">Cheque / Bank</th>
                              <th className="px-3 font-medium">Notes</th>
                              <th className="px-3 text-center font-medium">Status</th>
                              <th className="px-4 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/60">
                            {currentBooking.payments.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={8}
                                  className="p-8 text-center text-ink-muted"
                                >
                                  No payments recorded yet.
                                </td>
                              </tr>
                            ) : (
                              currentBooking.payments.map((p) => (
                                <tr
                                  key={p.id}
                                  className={cn(
                                    "h-[44px] transition-colors hover:bg-subtle/30",
                                    p.isVoided && "bg-sold/5 opacity-60",
                                  )}
                                >
                                  <td className="px-4 text-[11px] font-bold text-primary tabular-nums">
                                    {p.receiptNo}
                                  </td>
                                  <td className="px-3 text-ink tabular-nums">
                                    {new Date(p.paidAt).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="px-3 text-right font-semibold text-available tabular-nums">
                                    {formatPkr(p.amount)}
                                  </td>
                                  <td className="px-3 text-ink">
                                    {p.method.replaceAll("_", " ")}
                                  </td>
                                  <td className="px-3 text-ink-muted">
                                    {p.bank && `${p.bank}`}
                                    {p.chequeNo && ` (#${p.chequeNo})`}
                                    {!p.bank && !p.chequeNo && "—"}
                                  </td>
                                  <td className="max-w-[160px] truncate px-3 text-ink-muted italic">
                                    {p.notes || "—"}
                                  </td>
                                  <td className="px-3 text-center">
                                    {p.isVoided ? (
                                      <Badge tone="sold">VOIDED</Badge>
                                    ) : (
                                      <Badge tone="available">VALID</Badge>
                                    )}
                                  </td>
                                  <td className="px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setActiveReceipt({
                                            receiptNo: p.receiptNo,
                                            paidAt: p.paidAt,
                                            amountPkr: p.amount,
                                            method: p.method,
                                            chequeNo: p.chequeNo,
                                            bank: p.bank,
                                            notes: p.notes,
                                            clientName: clientProfile.client.fullName,
                                            clientCnic: clientProfile.client.cnic,
                                            clientPhone: clientProfile.client.phone,
                                            bookingNo: currentBooking.bookingNo,
                                            unitCode: currentBooking.unit.unitCode,
                                            floorName: currentBooking.unit.floorName,
                                            receivedByName: p.receiverName,
                                          });
                                          setReceiptModalOpen(true);
                                        }}
                                        className="h-7 px-2 text-[11px]"
                                        title="Print Receipt"
                                      >
                                        <Printer weight="light" className="size-3.5" />
                                      </Button>

                                      {userRole === "ADMIN" && !p.isVoided && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setActivePaymentForEdit(p);
                                              setEditPaymentModalOpen(true);
                                            }}
                                            className="h-7 px-2 text-[11px] text-primary"
                                            title="Edit Payment"
                                          >
                                            <PencilSimple
                                              weight="light"
                                              className="size-3.5"
                                            />
                                          </Button>

                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setActivePaymentForVoid(p);
                                              setVoidPaymentModalOpen(true);
                                            }}
                                            className="h-7 px-2 text-[11px] text-sold hover:bg-sold/10"
                                            title="Void Payment"
                                          >
                                            <Prohibit
                                              weight="light"
                                              className="size-3.5"
                                            />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </div>

          {/* Right Column (4 cols): Due This Week panel */}
          <div className="space-y-6 lg:col-span-4">
            <DueThisWeekCard
              summary={initialSummary}
              onSelectBooking={handleQuickDueBookingSelect}
            />
          </div>
        </div>
      )}

      {/* Record Payment Dialog */}
      {currentBooking && (
        <RecordPaymentDialog
          open={recordModalOpen}
          onOpenChange={setRecordModalOpen}
          booking={currentBooking}
          client={clientProfile!.client}
          onPaymentSuccess={handlePaymentRecorded}
        />
      )}

      {/* Printable Receipt Dialog */}
      <PaymentReceiptDialog
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        receipt={activeReceipt}
      />

      {/* Edit Payment Dialog (Admin Only) */}
      <EditPaymentDialog
        open={editPaymentModalOpen}
        onOpenChange={setEditPaymentModalOpen}
        payment={activePaymentForEdit}
        onSuccess={() => refetchProfile()}
      />

      {/* Void Payment Dialog (Admin Only) */}
      <VoidPaymentDialog
        open={voidPaymentModalOpen}
        onOpenChange={setVoidPaymentModalOpen}
        payment={activePaymentForVoid}
        onSuccess={() => refetchProfile()}
      />

      {/* Reschedule Installments Dialog (Admin Only) */}
      {currentBooking && (
        <RescheduleDialog
          open={rescheduleModalOpen}
          onOpenChange={setRescheduleModalOpen}
          booking={currentBooking}
          onSuccess={() => refetchProfile()}
        />
      )}
    </div>
  );
}
