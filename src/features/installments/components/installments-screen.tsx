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
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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

/**
 * Auto-formats numeric input into standard Pakistani CNIC format (12345-1234567-1).
 * If the input begins with digits, it applies the dashes progressively.
 */
function autoFormatCnic(val: string): string {
  // If input starts with a letter, don't format as CNIC
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
    // Search booking and select
    setSearchVal(bookingId);
    setDebouncedQ(bookingId);
  }

  function handlePaymentRecorded(receipt: PrintableReceiptData) {
    setActiveReceipt(receipt);
    setReceiptModalOpen(true);
    refetchProfile();
  }

  return (
    <div className="flex flex-col gap-6 p-4 select-none sm:p-6">
      <PageHeader
        title="Installments &amp; Collections"
        description="Search clients by name, CNIC, or booking number to manage payment schedules, waterfall receipts, and debt rescheduling."
      />

      {/* Big Search Bar */}
      <div className="card relative rounded-[12px] p-4">
        <label className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
          Customer &amp; Booking Lookup
        </label>
        <div className="relative mt-2">
          <MagnifyingGlass
            weight="light"
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchInputChange}
            placeholder="Search by Client Name, CNIC (12345-1234567-1), Phone, Booking #, or Unit Code..."
            className="h-12 w-full rounded-[8px] border border-line bg-surface pr-4 pl-11 font-sans text-[14px] text-ink shadow-xs placeholder:text-ink-faint focus:outline-primary"
          />
        </div>

        {/* Instant Search Results Dropdown */}
        {debouncedQ.length >= 2 && searchResults.length > 0 && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-[8px] border border-line bg-surface p-2 shadow-card">
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
                      <p className="font-mono text-[11px] text-ink-muted">
                        CNIC: {result.cnic} · Phone: {result.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.bookings.map((b) => (
                      <Badge key={b.id} tone="muted" className="font-mono text-[10px]">
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
      </div>

      {/* Due This Week Section (shown when no client selected or on landing) */}
      {!selectedClientId && (
        <DueThisWeekCard
          summary={initialSummary}
          onSelectBooking={handleQuickDueBookingSelect}
        />
      )}

      {/* Client Profile & Bookings Management View */}
      {selectedClientId && clientProfile && (
        <div className="flex flex-col gap-6">
          {/* Client Header Card */}
          <div className="card flex flex-col gap-4 rounded-[12px] border-l-4 border-l-primary p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User weight="bold" className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[16px] font-bold text-ink">
                    {clientProfile.client.fullName}
                  </h2>
                  <Badge tone="primary" className="font-mono text-[11px]">
                    CNIC: {clientProfile.client.cnic}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-ink-muted">
                  <span>
                    Phone:{" "}
                    <strong className="font-sans text-ink tabular-nums">
                      {clientProfile.client.phone}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>Address: {clientProfile.client.homeAddress}</span>
                  {clientProfile.nextOfKin && (
                    <>
                      <span>·</span>
                      <span>
                        Next of Kin:{" "}
                        <strong className="text-ink">
                          {clientProfile.nextOfKin.name}
                        </strong>{" "}
                        ({clientProfile.nextOfKin.relation})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedClientId(null)}
              className="text-[11px]"
            >
              Clear Selection
            </Button>
          </div>

          {/* Bookings Selector Tabs */}
          {clientProfile.bookings.length === 0 ? (
            <div className="card rounded-[12px] p-8 text-center text-[13px] text-ink-muted">
              No active or historical bookings found for this client.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* If multiple bookings, show selector pills */}
              {clientProfile.bookings.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[12px] font-medium text-ink-muted">
                    Bookings:
                  </span>
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
                        <span className="font-mono">{b.unit.unitCode}</span>
                        <span>({b.bookingNo})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Booking Overview & Actions */}
              {currentBooking && (
                <div className="flex flex-col gap-4">
                  {/* KPI Summary Banner */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="card rounded-[10px] border-l-4 border-l-primary p-3">
                      <span className="text-[10px] font-medium text-ink-muted uppercase">
                        Net Contract Price
                      </span>
                      <p className="mt-1 font-sans text-[16px] font-semibold text-ink tabular-nums">
                        {formatPkr(currentBooking.netPrice)}
                      </p>
                      <span className="text-[10px] text-ink-muted">
                        Unit {currentBooking.unit.unitCode} (
                        {currentBooking.unit.floorName})
                      </span>
                    </div>

                    <div className="card rounded-[10px] border-l-4 border-l-available p-3">
                      <span className="text-[10px] font-medium text-ink-muted uppercase">
                        Total Paid
                      </span>
                      <p className="mt-1 font-sans text-[16px] font-semibold text-available tabular-nums">
                        {formatPkr(currentBooking.paidTotal)}
                      </p>
                      <span className="font-sans text-[10px] text-ink-muted tabular-nums">
                        {currentBooking.paidPercent}% paid
                      </span>
                    </div>

                    <div className="card rounded-[10px] border-l-4 border-l-accent p-3">
                      <span className="text-[10px] font-medium text-ink-muted uppercase">
                        Remaining Balance
                      </span>
                      <p className="mt-1 font-sans text-[16px] font-semibold text-accent tabular-nums">
                        {formatPkr(currentBooking.balance)}
                      </p>
                      <span className="text-[10px] text-ink-muted">
                        Plan: {currentBooking.plan.toLowerCase()}
                      </span>
                    </div>

                    <div className="card rounded-[10px] border-l-4 border-l-sold p-3">
                      <span className="text-[10px] font-medium text-ink-muted uppercase">
                        Overdue Exposure
                      </span>
                      <p className="mt-1 font-sans text-[16px] font-semibold text-sold tabular-nums">
                        {formatPkr(currentBooking.overdueAmount)}
                      </p>
                      <span className="text-[10px] text-ink-muted">
                        {currentBooking.overdueAmount !== "0.00"
                          ? "Past due balance"
                          : "Up to date"}
                      </span>
                    </div>

                    <div className="card flex flex-col justify-between rounded-[10px] p-3">
                      <span className="text-[10px] font-medium text-ink-muted uppercase">
                        Status
                      </span>
                      <div className="my-1">
                        <Badge
                          tone={
                            currentBooking.status === "ACTIVE"
                              ? "primary"
                              : currentBooking.status === "COMPLETED"
                                ? "sold"
                                : "muted"
                          }
                        >
                          {currentBooking.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-ink-muted">
                        Unit: {currentBooking.unit.status}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-subtle/40 p-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setRecordModalOpen(true)}
                        className="gap-1.5"
                      >
                        <Coins weight="bold" className="size-4" />
                        <span>Record Payment</span>
                      </Button>

                      {userRole === "ADMIN" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRescheduleModalOpen(true)}
                          className="gap-1.5"
                        >
                          <CalendarDots weight="light" className="size-4" />
                          <span>Reschedule Installments</span>
                        </Button>
                      )}
                    </div>

                    <span className="font-mono text-[11px] text-ink-muted">
                      Booking #{currentBooking.bookingNo}
                    </span>
                  </div>

                  {/* Schedule & Payment History Tabs */}
                  <Tabs defaultValue="schedule" className="w-full">
                    <TabsList className="mb-3">
                      <TabsTrigger value="schedule">
                        Installment Schedule ({currentBooking.schedule.length})
                      </TabsTrigger>
                      <TabsTrigger value="payments">
                        Payment History ({currentBooking.payments.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Schedule Table Tab */}
                    <TabsContent value="schedule" className="m-0">
                      <div className="card overflow-hidden rounded-[12px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-[12px]">
                            <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                              <tr>
                                <th className="w-12 px-3 py-2.5 text-center">Seq</th>
                                <th className="px-4 py-2.5">Due Date</th>
                                <th className="px-4 py-2.5 text-right">Amount</th>
                                <th className="px-4 py-2.5 text-right">Paid</th>
                                <th className="px-4 py-2.5 text-right">Balance</th>
                                <th className="px-4 py-2.5">Receipt #</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line/60">
                              {currentBooking.schedule.map((inst) => {
                                const isOverdue = inst.status === "OVERDUE";
                                return (
                                  <tr
                                    key={inst.id}
                                    className={cn(
                                      "transition-colors hover:bg-subtle/30",
                                      isOverdue && "bg-sold/5",
                                    )}
                                  >
                                    <td className="px-3 py-2.5 text-center font-mono text-[11px] text-ink-muted">
                                      #{inst.seq}
                                    </td>
                                    <td className="px-4 py-2.5 tabular-nums">
                                      <span
                                        className={
                                          isOverdue
                                            ? "font-semibold text-sold"
                                            : "text-ink"
                                        }
                                      >
                                        {
                                          new Date(inst.dueDate)
                                            .toISOString()
                                            .split("T")[0]
                                        }
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-ink tabular-nums">
                                      {formatPkr(inst.amount)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium text-available tabular-nums">
                                      {formatPkr(inst.paidAmount)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-semibold text-ink tabular-nums">
                                      {formatPkr(inst.balance)}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-[11px] text-primary">
                                      {inst.receiptNos || "-"}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
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
                      </div>
                    </TabsContent>

                    {/* Payment History Tab */}
                    <TabsContent value="payments" className="m-0">
                      <div className="card overflow-hidden rounded-[12px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-[12px]">
                            <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                              <tr>
                                <th className="px-4 py-2.5">Receipt #</th>
                                <th className="px-3 py-2.5">Payment Date</th>
                                <th className="px-3 py-2.5 text-right">Amount</th>
                                <th className="px-3 py-2.5">Method</th>
                                <th className="px-3 py-2.5">Cheque / Bank</th>
                                <th className="px-3 py-2.5">Notes</th>
                                <th className="px-3 py-2.5 text-center">Status</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line/60">
                              {currentBooking.payments.map((p) => (
                                <tr
                                  key={p.id}
                                  className={cn(
                                    "transition-colors hover:bg-subtle/30",
                                    p.isVoided && "bg-sold/5 opacity-60",
                                  )}
                                >
                                  <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-primary">
                                    {p.receiptNo}
                                  </td>
                                  <td className="px-3 py-2.5 text-ink tabular-nums">
                                    {new Date(p.paidAt).toISOString().split("T")[0]}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-semibold text-available tabular-nums">
                                    {formatPkr(p.amount)}
                                  </td>
                                  <td className="px-3 py-2.5 text-ink">
                                    {p.method.replaceAll("_", " ")}
                                  </td>
                                  <td className="px-3 py-2.5 text-ink-muted">
                                    {p.bank && `${p.bank}`}
                                    {p.chequeNo && ` (#${p.chequeNo})`}
                                    {!p.bank && !p.chequeNo && "-"}
                                  </td>
                                  <td className="max-w-[160px] truncate px-3 py-2.5 text-ink-muted italic">
                                    {p.notes || "-"}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {p.isVoided ? (
                                      <Badge tone="sold">VOIDED</Badge>
                                    ) : (
                                      <Badge tone="available">VALID</Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
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
                                            className="h-7 px-2 text-[11px] text-ink hover:text-primary"
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
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
