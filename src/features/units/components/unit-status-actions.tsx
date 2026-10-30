"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { computeTotalPrice, formatPkrCompact, formatPkrLedger } from "@/lib/money";
import { changeUnitStatus } from "../actions";
import { REVERSE_REASON_MIN } from "../status";
import type { InventoryRow } from "../types";

type StatusMode = "idle" | "sell" | "reverse";

type UnitStatusActionsProps = {
  unit: InventoryRow;
  canSell: boolean;
  canReverse: boolean;
  children: ReactNode;
};

export function UnitStatusActions({
  unit,
  canSell,
  canReverse,
  children,
}: UnitStatusActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<StatusMode>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showSell = unit.status === "AVAILABLE" && canSell && unit.isSellable;
  const showReverse = unit.status === "SOLD" && canReverse;

  async function sell(input: { bookingRef: string; reason?: string }) {
    setPending(true);
    setError(null);
    try {
      await changeUnitStatus({
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "SOLD",
        bookingRef: input.bookingRef,
        reason: input.reason,
      });
      setMode("idle");
      setPending(false);
      router.refresh();
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
      setPending(false);
    }
  }

  async function reverse(input: { reason: string }) {
    setPending(true);
    setError(null);
    try {
      await changeUnitStatus({
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "AVAILABLE",
        reason: input.reason,
      });
      setMode("idle");
      setPending(false);
      router.refresh();
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
      setPending(false);
    }
  }

  if (mode === "sell") {
    return (
      <SellConfirm
        unit={unit}
        pending={pending}
        error={error}
        onCancel={() => {
          setError(null);
          setMode("idle");
        }}
        onConfirm={sell}
      />
    );
  }

  if (mode === "reverse") {
    return (
      <ReverseConfirm
        unit={unit}
        pending={pending}
        error={error}
        onCancel={() => {
          setError(null);
          setMode("idle");
        }}
        onConfirm={reverse}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {children}
      {showSell || showReverse ? (
        <div className="flex items-center gap-2 border-t border-line px-4 py-3">
          {showSell ? (
            <Button onClick={() => setMode("sell")} disabled={pending}>
              Mark as Sold
            </Button>
          ) : null}
          {showReverse ? (
            <Button
              variant="dangerOutline"
              onClick={() => setMode("reverse")}
              disabled={pending}
            >
              Reverse sale
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SellConfirm({
  unit,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  unit: InventoryRow;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (input: { bookingRef: string; reason?: string }) => Promise<void>;
}) {
  const [bookingRef, setBookingRef] = useState(unit.bookingRef ?? "");
  const [note, setNote] = useState("");
  const total = computeTotalPrice(
    unit.ratePerSqftPkr,
    unit.netAreaSqft,
    unit.priceAdjustmentPkr,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        <p className="text-[11px] tracking-wide text-ink-muted">Confirm sale</p>
        <div className="border-b border-line py-2">
          <p className="text-[11px] tracking-wide text-ink-muted">Unit code</p>
          <p className="unit-code">{unit.unitCode}</p>
        </div>
        <div className="border-b border-line py-2">
          <p className="text-[11px] tracking-wide text-ink-muted">Current total</p>
          <p className="font-display text-[22px] tabular-nums">
            {formatPkrLedger(total)}
          </p>
          <p className="text-[12px] text-ink-muted">{formatPkrCompact(total)}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sale-booking-ref">Booking ref</Label>
          <Input
            id="sale-booking-ref"
            value={bookingRef}
            onChange={(event) => setBookingRef(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sale-note">Note (optional)</Label>
          <textarea
            id="sale-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink"
          />
        </div>
        {error ? (
          <p className="text-[12px] text-sold" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={pending || !bookingRef.trim()}
          onClick={() =>
            void onConfirm({
              bookingRef: bookingRef.trim(),
              reason: note.trim() || undefined,
            })
          }
        >
          {pending ? "Saving…" : "Confirm sale"}
        </Button>
      </div>
    </div>
  );
}

function ReverseConfirm({
  unit,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  unit: InventoryRow;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (input: { reason: string }) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const tooShort = reason.trim().length > 0 && reason.trim().length < REVERSE_REASON_MIN;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        <p className="text-[11px] tracking-wide text-sold">Reverse sale</p>
        <div className="border-b border-line py-2">
          <p className="text-[11px] tracking-wide text-ink-muted">Unit code</p>
          <p className="unit-code">{unit.unitCode}</p>
        </div>
        <p className="text-[13px] text-ink-muted">
          This returns the unit to available. The booking ref stays in history. Sold
          price, date, and seller are cleared.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="reverse-reason">Reason</Label>
          <textarea
            id="reverse-reason"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink"
          />
          {tooShort ? (
            <p className="text-[12px] text-sold" role="alert">
              Enter at least {REVERSE_REASON_MIN} characters.
            </p>
          ) : null}
        </div>
        {error ? (
          <p className="text-[12px] text-sold" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="dangerOutline"
          disabled={pending || reason.trim().length < REVERSE_REASON_MIN}
          onClick={() => void onConfirm({ reason: reason.trim() })}
        >
          {pending ? "Saving…" : "Confirm reverse"}
        </Button>
      </div>
    </div>
  );
}
