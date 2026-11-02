"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { computeTotalPrice, formatPkrCompact, formatPkrLedger } from "@/lib/money";
import { changeUnitStatus } from "../actions";
import { REVERSE_REASON_MIN } from "../status";
import type { InventoryRow, StatusHistoryEntry } from "../types";
import { UnitRead } from "./unit-read";

type StatusMode = "idle" | "sell" | "reverse";

interface UnitStatusActionsProps {
  unit: InventoryRow;
  history?: StatusHistoryEntry[];
  canSell: boolean;
  canReverse: boolean;
  children?: ReactNode;
}

export function UnitStatusActions({
  unit,
  history,
  canSell,
  canReverse,
  children,
}: UnitStatusActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [prevUnit, setPrevUnit] = useState(unit);
  const [currentUnit, setCurrentUnit] = useState<InventoryRow>(unit);
  if (unit !== prevUnit) {
    setPrevUnit(unit);
    setCurrentUnit(unit);
  }

  const [prevHistory, setPrevHistory] = useState(history);
  const [currentHistory, setCurrentHistory] = useState<StatusHistoryEntry[]>(
    history ?? [],
  );
  if (history !== prevHistory) {
    setPrevHistory(history);
    setCurrentHistory(history ?? []);
  }

  const [mode, setMode] = useState<StatusMode>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showSell =
    currentUnit.status === "AVAILABLE" && canSell && currentUnit.isSellable;
  const showReverse = currentUnit.status === "SOLD" && canReverse;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window as unknown as {
      __erpChangeUnitStatus?: typeof changeUnitStatus;
    };
    host.__erpChangeUnitStatus = changeUnitStatus;
    return () => {
      delete host.__erpChangeUnitStatus;
    };
  }, []);

  async function sell(input: { bookingRef: string; reason?: string }) {
    setPending(true);
    setError(null);
    try {
      await changeUnitStatus({
        unitId: currentUnit.id,
        expectedVersion: currentUnit.version,
        toStatus: "SOLD",
        bookingRef: input.bookingRef,
        reason: input.reason,
      });
      setCurrentUnit((prev) => ({
        ...prev,
        status: "SOLD",
        bookingRef: input.bookingRef,
        version: prev.version + 1,
      }));
      setCurrentHistory((prev) => [
        {
          id: "opt-" + Date.now(),
          unitId: currentUnit.id,
          fromStatus: "AVAILABLE",
          toStatus: "SOLD",
          reason: input.reason ?? null,
          bookingRef: input.bookingRef ?? null,
          soldPricePkr: currentUnit.soldPricePkr,
          actorId: "",
          actorName: "Current User",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setMode("idle");
      setPending(false);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["unit-detail", currentUnit.id] });
      toast.success(`Unit ${currentUnit.unitCode} marked as Sold`);
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
        unitId: currentUnit.id,
        expectedVersion: currentUnit.version,
        toStatus: "AVAILABLE",
        reason: input.reason,
      });
      setCurrentUnit((prev) => ({
        ...prev,
        status: "AVAILABLE",
        soldPricePkr: null,
        version: prev.version + 1,
      }));
      setCurrentHistory((prev) => [
        {
          id: "opt-" + Date.now(),
          unitId: currentUnit.id,
          fromStatus: "SOLD",
          toStatus: "AVAILABLE",
          reason: input.reason,
          bookingRef: currentUnit.bookingRef,
          soldPricePkr: null,
          actorId: "",
          actorName: "Current User",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setMode("idle");
      setPending(false);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["unit-detail", currentUnit.id] });
      toast.success(`Sale reversed for unit ${currentUnit.unitCode}`);
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
        unit={currentUnit}
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
        unit={currentUnit}
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
      {history ? <UnitRead unit={currentUnit} history={currentHistory} /> : children}
      {showSell || showReverse ? (
        <div className="flex h-[56px] shrink-0 items-center justify-end gap-2.5 border-t border-line bg-surface px-5">
          {showSell ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setMode("sell")}
              disabled={pending}
            >
              Mark as Sold
            </Button>
          ) : null}
          {showReverse ? (
            <Button
              variant="danger"
              size="md"
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <p className="border-b border-line pb-1 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          Confirm unit sale
        </p>

        <div className="space-y-2 rounded-[8px] border border-line bg-subtle/50 p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-muted">Unit code</span>
            <span className="unit-code font-mono font-medium text-ink">
              {unit.unitCode}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-line/60 pt-2">
            <span className="text-[13px] text-ink-muted">Final selling price</span>
            <div className="text-right">
              <span className="price font-sans text-[18px] font-semibold text-ink tabular-nums">
                {formatPkrLedger(total)}
              </span>
              <p className="price font-sans text-[11px] text-ink-muted tabular-nums">
                {formatPkrCompact(total)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="sale-booking-ref"
            className="text-[12px] font-medium text-ink-muted"
          >
            Booking ref
          </Label>
          <Input
            id="sale-booking-ref"
            value={bookingRef}
            onChange={(event) => setBookingRef(event.target.value)}
            autoComplete="off"
            placeholder="e.g. BK-2026-001"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sale-note" className="text-[12px] font-medium text-ink-muted">
            Note (optional)
          </Label>
          <Textarea
            id="sale-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Buyer details or terms…"
          />
        </div>

        {error ? (
          <p
            className="rounded-[6px] border border-sold/30 bg-sold/5 p-2.5 text-[12px] text-sold"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex h-[56px] shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={pending}
          disabled={pending || !bookingRef.trim()}
          onClick={() =>
            void onConfirm({
              bookingRef: bookingRef.trim(),
              reason: note.trim() || undefined,
            })
          }
        >
          Confirm sale
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <p className="border-b border-line pb-1 text-[11px] font-semibold tracking-wider text-sold uppercase">
          Reverse unit sale
        </p>

        <div className="space-y-1 rounded-[8px] border border-sold/20 bg-sold/5 p-4">
          <p className="unit-code font-mono text-[13px] font-medium text-ink">
            {unit.unitCode}
          </p>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Reversing returns this unit to Available status. The booking reference and
            price are cleared from active ledger and retained in history.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="reverse-reason"
            className="text-[12px] font-medium text-ink-muted"
          >
            Reason
          </Label>
          <Textarea
            id="reverse-reason"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={`Minimum ${REVERSE_REASON_MIN} characters justification…`}
          />
          {tooShort ? (
            <p className="text-[12px] text-sold" role="alert">
              Enter at least {REVERSE_REASON_MIN} characters.
            </p>
          ) : null}
        </div>

        {error ? (
          <p
            className="rounded-[6px] border border-sold/30 bg-sold/5 p-2.5 text-[12px] text-sold"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex h-[56px] shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          size="md"
          loading={pending}
          disabled={pending || reason.trim().length < REVERSE_REASON_MIN}
          onClick={() => void onConfirm({ reason: reason.trim() })}
        >
          Confirm reverse
        </Button>
      </div>
    </div>
  );
}
