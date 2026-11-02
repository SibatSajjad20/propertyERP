"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClockCountdown,
  Hourglass,
  Receipt,
  XCircle,
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
import { Label } from "@/components/ui/label";
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

  const countdown = formatCountdown(reservation.expiresAt);
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

  return (
    <div className="space-y-6">
      {/* Top Bar with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href={"/reservations" as never}>
              <ArrowLeft weight="light" className="mr-1 size-3.5" />
              Reservations
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="unit-code font-mono text-[18px] font-bold text-accent">
                HOLD-{reservation.unitCode}
              </span>
              <Badge tone={isActive ? "accent" : "muted"}>
                {isActive ? "Active Hold" : reservation.status}
              </Badge>
              {isActive && (
                <span className="text-[12px] font-medium text-accent">
                  {countdown.label}
                </span>
              )}
            </div>
            <p className="text-[12px] text-ink-muted">
              Unit {reservation.unitCode} reserved for {reservation.clientName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {isActive && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setExtendOpen(true)}
              className="gap-1.5"
            >
              <Hourglass weight="light" className="size-4" />
              Extend Hold
            </Button>
          )}

          {isActive && canCancel && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCancelOpen(true)}
              className="gap-1.5 text-sold hover:bg-sold/10"
            >
              <XCircle weight="light" className="size-4" />
              Cancel Reservation
            </Button>
          )}
        </div>
      </div>

      {/* Expiry Banner */}
      {isActive && (
        <div className="flex items-center justify-between rounded-[8px] border border-accent/30 bg-accent/10 px-4 py-3">
          <div className="flex items-center gap-2 text-accent">
            <ClockCountdown weight="bold" className="size-5" />
            <span className="text-[13px] font-medium">
              Reservation is active — expires on{" "}
              {new Date(reservation.expiresAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <span className="font-semibold text-accent tabular-nums">
            {countdown.label}
          </span>
        </div>
      )}

      {/* Detail Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Unit Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[14px] font-semibold text-ink">Property Unit</h4>
            <Link
              href={`/units/${reservation.unitId}`}
              className="unit-code font-mono text-[14px] font-bold text-primary hover:underline"
            >
              {reservation.unitCode}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div>
              <span className="text-ink-muted">Floor & Category:</span>
              <p className="font-medium text-ink">
                {reservation.floorName} · {reservation.categoryName}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Net Area:</span>
              <p className="font-medium text-ink tabular-nums">
                {reservation.netAreaSqft} sq ft
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Rate / sq ft:</span>
              <p className="font-medium text-ink tabular-nums">
                {formatPkr(reservation.ratePerSqftPkr)}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Asking Price:</span>
              <p className="font-medium text-ink tabular-nums">
                {formatPkr(reservation.computedPricePkr || "0")}
              </p>
            </div>
          </div>
        </div>

        {/* Client & Kin Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[14px] font-semibold text-ink">Prospective Buyer</h4>
            <span className="font-mono text-[12px] text-ink-muted">
              {reservation.clientCnic}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div>
              <span className="text-ink-muted">Full Name:</span>
              <p className="font-medium text-ink">{reservation.clientName}</p>
            </div>
            <div>
              <span className="text-ink-muted">Phone:</span>
              <p className="font-medium text-ink tabular-nums">
                {reservation.clientPhone}
              </p>
            </div>
            {nextOfKin && (
              <div>
                <span className="text-ink-muted">Next of Kin:</span>
                <p className="font-medium text-ink">
                  {nextOfKin.name} ({nextOfKin.relation})
                </p>
              </div>
            )}
            <div>
              <span className="text-ink-muted">Reserved By:</span>
              <p className="font-medium text-ink">
                {reservation.createdByName || "Sales Officer"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {reservation.notes && (
        <div className="card p-4 text-[12px]">
          <span className="font-medium text-ink">Notes / Conditions:</span>
          <p className="mt-1 text-ink-muted italic">{reservation.notes}</p>
        </div>
      )}

      {/* Extend Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label className="text-[12px]">Additional Days</Label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 7, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExtendDays(days)}
                  className={cn(
                    "rounded border p-2 text-center text-[12px] font-medium transition-colors",
                    extendDays === days
                      ? "border-accent bg-accent/10 font-bold text-accent"
                      : "border-line text-ink hover:bg-subtle",
                  )}
                >
                  +{days} Days
                </button>
              ))}
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
              {isSubmitting ? "Extending..." : "Confirm Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px]">
            <p className="text-ink-muted">
              Cancelling will release unit {reservation.unitCode} back to Available status
              immediately.
            </p>
            <div>
              <Label className="text-[12px]">Cancellation Reason (Required)</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Buyer changed mind / financing denied"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setCancelOpen(false)}
              disabled={isSubmitting}
            >
              Keep Active
            </Button>
            <Button
              variant="primary"
              onClick={handleCancel}
              disabled={isSubmitting || cancelReason.trim().length < 5}
              className="bg-sold hover:bg-sold/90"
            >
              {isSubmitting ? "Cancelling..." : "Confirm & Release Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
