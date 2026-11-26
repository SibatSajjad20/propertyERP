/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ClockCountdown,
  Hourglass,
  Receipt,
  XCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { DefinitionList } from "@/components/ui/definition-list";
import { ActivityList, type ActivityItem } from "@/components/ui/activity-list";
import { Badge, Pill } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import type { UserRole } from "@/db/schema/enums";
import { cancelReservation, extendReservation } from "../actions";
import { formatCountdown } from "./reservations-screen";

interface ReservationDetailScreenProps {
  data: any;
  role: UserRole;
}

export function ReservationDetailScreen({ data, role }: ReservationDetailScreenProps) {
  const router = useRouter();
  const { reservation, nextOfKin } = data;

  const [extendOpen, setExtendOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [extendDays, setExtendDays] = React.useState(7);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const countdown = formatCountdown(reservation.expiresAt, reservation.durationDays);
  const isActive = reservation.status === "ACTIVE" && !countdown.isExpired;
  const canCancel = role === "ADMIN" || role === "INVENTORY_MANAGER";

  async function handleExtend() {
    setIsSubmitting(true);
    try {
      await extendReservation({
        reservationId: reservation.id,
        additionalDays: extendDays,
      });
      toast.success(`Reservation extended by ${extendDays} days.`);
      setExtendOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to extend reservation");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason || cancelReason.trim().length < 5) {
      toast.error("Please provide a reason of at least 5 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await cancelReservation({
        reservationId: reservation.id,
        reason: cancelReason,
      });
      toast.success("Reservation cancelled. Unit released back to Available.");
      setCancelOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel reservation");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reservation history activity items
  const historyItems: ActivityItem[] = React.useMemo(() => {
    const items: ActivityItem[] = [];

    if (reservation.createdAt) {
      items.push({
        id: `created-${reservation.id}`,
        title: "Reservation Created",
        subLine: `Held for ${reservation.clientName} (${reservation.durationDays} days)`,
        time: new Date(reservation.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        active: true,
      });
    }

    if (reservation.cancelledAt) {
      items.push({
        id: `cancelled-${reservation.id}`,
        title: "Reservation Cancelled",
        subLine: reservation.cancelledReason || "Cancelled by manager",
        time: new Date(reservation.cancelledAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
    }

    if (reservation.status === "CONVERTED") {
      items.push({
        id: `converted-${reservation.id}`,
        title: "Converted to Booking",
        subLine: "Booking agreement created and registered",
        time: new Date(reservation.expiresAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        active: true,
      });
    }

    return items;
  }, [reservation]);

  // Conversion checklist items
  const checklist = [
    {
      label: "Client full legal name",
      ok: Boolean(reservation.clientName?.trim()),
    },
    {
      label: "National identity CNIC verified",
      ok: Boolean(reservation.clientCnic?.trim()),
    },
    {
      label: "Contact phone number",
      ok: Boolean(reservation.clientPhone?.trim()),
    },
    {
      label: "Residential and postal address",
      ok: Boolean(reservation.homeAddress?.trim() && reservation.postalAddress?.trim()),
    },
    {
      label: "Nominee / Next of kin registered",
      ok: Boolean(nextOfKin?.name?.trim()),
    },
  ];

  return (
    <div className="space-y-6">
      {/* PageHeader with Actions */}
      <PageHeader
        title={`HOLD-${reservation.unitCode}`}
        idTitle={true}
        back={{ label: "Reservations", href: "/reservations" }}
        badge={
          <Pill tone={isActive ? "accent" : "muted"}>
            {isActive ? "Active Hold" : reservation.status}
          </Pill>
        }
        meta={[
          `Unit ${reservation.unitCode}`,
          `Client ${reservation.clientName}`,
          `${reservation.floorName} · ${reservation.blockName}`,
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isActive && canCancel && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCancelOpen(true)}
                className="gap-1.5 text-sold hover:bg-sold/10"
              >
                <XCircle weight="light" className="size-4" />
                Cancel reservation
              </Button>
            )}

            {isActive && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setExtendOpen(true)}
                className="gap-1.5"
              >
                <Hourglass weight="light" className="size-4" />
                Extend hold
              </Button>
            )}

            {isActive && (
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  router.push(
                    `/bookings/new?unitId=${reservation.unitId}&clientId=${reservation.clientId}&reservationId=${reservation.id}` as never,
                  )
                }
                className="gap-1.5"
              >
                <Receipt weight="light" className="size-4" />
                Convert to Booking
                <ArrowRight weight="light" className="size-3.5" />
              </Button>
            )}
          </div>
        }
      />

      {/* 3-Cell StatStrip */}
      <StatStrip columns={3}>
        <StatCell
          label="TIME REMAINING"
          value={
            <span
              className={cn(countdown.isUrgent ? "font-semibold text-sold" : "text-ink")}
            >
              {countdown.label}
            </span>
          }
          subLine={
            isActive
              ? `Deadline: ${new Date(reservation.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
              : "Hold no longer active"
          }
          progress={isActive ? countdown.percentRemaining : 0}
        />

        <StatCell
          label="UNIT ASKING PRICE"
          value={formatPkr(reservation.computedPricePkr || "0")}
          subLine={`${reservation.categoryName} · ${effectivePricingArea(reservation.grossAreaSqft, reservation.netAreaSqft)} sq ft`}
        />

        <StatCell
          label="HOLD PERIOD"
          value={`${reservation.durationDays} days`}
          subLine={`Started ${new Date(reservation.startAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`}
        />
      </StatStrip>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Buyer details, History, Inline extend */}
        <div className="space-y-6 lg:col-span-7">
          <Panel title="Prospective Buyer Details">
            <DefinitionList
              items={[
                {
                  label: "Full Name",
                  value: `${reservation.clientTitle ? `${reservation.clientTitle} ` : ""}${reservation.clientName}`,
                },
                {
                  label: `${reservation.clientRelationPrefix || "S/O"}`,
                  value: reservation.clientRelationName,
                },
                {
                  label: "CNIC",
                  value: (
                    <span className="font-sans font-medium text-ink tabular-nums">
                      {reservation.clientCnic}
                    </span>
                  ),
                },
                {
                  label: "Phone",
                  value: <span className="tabular-nums">{reservation.clientPhone}</span>,
                },
                {
                  label: "Home Address",
                  value: (
                    <span className="break-words text-ink">
                      {reservation.homeAddress}
                    </span>
                  ),
                },
                {
                  label: "Postal Address",
                  value: (
                    <span className="break-words text-ink">
                      {reservation.postalAddress}
                    </span>
                  ),
                },
                ...(nextOfKin
                  ? [
                      {
                        label: "Nominee",
                        value: `${nextOfKin.name} (${nextOfKin.relation})`,
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>

          {/* Inline Extend Reservation Panel if Active */}
          {isActive && (
            <Panel title="Extend Reservation" hint="Add additional hold days">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-[180px]">
                  <Label htmlFor="ext-days" className="mb-1 block text-[12px]">
                    Additional Days
                  </Label>
                  <Select
                    value={extendDays.toString()}
                    onValueChange={(val) => setExtendDays(Number(val))}
                  >
                    <SelectTrigger id="ext-days" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">+1 Day (24 Hours)</SelectItem>
                      <SelectItem value="3">+3 Days</SelectItem>
                      <SelectItem value="7">+7 Days (1 Week)</SelectItem>
                      <SelectItem value="15">+15 Days</SelectItem>
                      <SelectItem value="30">+30 Days (1 Month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExtend}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Extending…" : "Apply Extension"}
                </Button>
              </div>
            </Panel>
          )}

          {/* Reservation History */}
          <Panel title="Reservation History" hint="Timeline of events">
            <ActivityList items={historyItems} />
          </Panel>
        </div>

        {/* Right Column (5 cols): Property unit & Conversion checklist */}
        <div className="space-y-6 lg:col-span-5">
          <Panel
            title="Property Unit"
            actions={
              <Link
                href={`/units/${reservation.unitId}`}
                className="text-[12.5px] font-medium text-primary hover:underline"
              >
                View Unit
              </Link>
            }
          >
            <DefinitionList
              items={[
                {
                  label: "Unit Code",
                  value: (
                    <span className="font-sans font-medium text-ink tabular-nums">
                      {formatUnitDisplayCode(
                        reservation.unitCode,
                        reservation.categoryName,
                      )}
                    </span>
                  ),
                },
                {
                  label: "Floor / Block",
                  value: `${reservation.floorName} · ${reservation.blockName}`,
                },
                {
                  label: "Category",
                  value: reservation.categoryName,
                },
                {
                  label: "Gross Area",
                  value: (
                    <span className="tabular-nums">
                      {effectivePricingArea(
                        reservation.grossAreaSqft,
                        reservation.netAreaSqft,
                      )}{" "}
                      sq ft
                    </span>
                  ),
                },
                {
                  label: "Rate / sq ft",
                  value: (
                    <span className="tabular-nums">
                      {formatPkr(reservation.ratePerSqftPkr)}
                    </span>
                  ),
                },
                {
                  label: "Asking Price",
                  value: (
                    <span className="font-semibold text-ink tabular-nums">
                      {formatPkr(reservation.computedPricePkr || "0")}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>

          {/* Before Converting Checklist */}
          <Panel title="Conversion Readiness" hint="Prerequisites for formal booking">
            <div className="space-y-2.5">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-[8px] border border-line bg-surface p-2.5 text-[12.5px]"
                >
                  <span className="text-ink">{item.label}</span>
                  {item.ok ? (
                    <span className="bg-available-soft flex size-4 items-center justify-center rounded-full text-available">
                      <Check weight="bold" className="size-2.5" />
                    </span>
                  ) : (
                    <span className="rounded-[4px] border border-sold/30 bg-sold/10 px-1.5 py-0.5 text-[10.5px] font-medium text-sold">
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isActive && (
              <div className="mt-4 border-t border-line pt-3">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full gap-1.5"
                  onClick={() =>
                    router.push(
                      `/bookings/new?unitId=${reservation.unitId}&clientId=${reservation.clientId}&reservationId=${reservation.id}` as never,
                    )
                  }
                >
                  <Receipt weight="light" className="size-4" />
                  Proceed to New Booking
                </Button>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Cancel Reservation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px]">
            <p className="text-ink-muted">
              Are you sure you want to cancel this reservation for{" "}
              <strong className="text-ink">{reservation.unitCode}</strong>? The unit will
              be immediately released back to <strong>AVAILABLE</strong>.
            </p>
            <div>
              <Label className="mb-1 block text-[12px]">Cancellation Reason *</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancelling reservation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setCancelOpen(false)}
              disabled={isSubmitting}
            >
              Keep Hold
            </Button>
            <Button
              variant="primary"
              onClick={handleCancel}
              disabled={isSubmitting || cancelReason.trim().length < 5}
              className="bg-sold hover:bg-sold/90"
            >
              {isSubmitting ? "Cancelling…" : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Reservation Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Reservation Hold</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px]">
            <p className="text-ink-muted">
              Select additional days to extend the expiration deadline for Unit{" "}
              <strong className="text-ink">{reservation.unitCode}</strong>.
            </p>
            <div>
              <Label className="mb-1 block text-[12px]">Additional Days</Label>
              <Select
                value={extendDays.toString()}
                onValueChange={(val) => setExtendDays(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">+1 Day (24 Hours)</SelectItem>
                  <SelectItem value="3">+3 Days</SelectItem>
                  <SelectItem value="7">+7 Days (1 Week)</SelectItem>
                  <SelectItem value="15">+15 Days</SelectItem>
                  <SelectItem value="30">+30 Days (1 Month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setExtendOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExtend} disabled={isSubmitting}>
              {isSubmitting ? "Extending…" : "Save Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
