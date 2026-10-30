import { formatKarachiDateTime } from "@/lib/datetime";
import { formatPkrLedger } from "@/lib/money";
import type { StatusHistoryEntry } from "../types";

type StatusHistoryProps = {
  entries: StatusHistoryEntry[];
};

function statusLabel(status: StatusHistoryEntry["fromStatus"]): string {
  return status === "SOLD" ? "Sold" : "Available";
}

export function StatusHistory({ entries }: StatusHistoryProps) {
  return (
    <div className="mt-6 border-t border-line pt-4">
      <p className="text-[11px] tracking-wide text-ink-muted">Status history</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-[13px] text-ink-muted">No status changes yet.</p>
      ) : (
        <ol className="mt-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="relative border-l border-line pb-4 pl-4 last:pb-0"
            >
              <span
                className="absolute top-1.5 left-0 size-1.5 -translate-x-1/2 rounded-full bg-ink"
                aria-hidden="true"
              />
              <p className="text-[13px] text-ink">
                {statusLabel(entry.fromStatus)} → {statusLabel(entry.toStatus)}
              </p>
              <p className="text-[12px] text-ink-muted">
                {entry.actorName ?? "Unknown"}
                <span className="mx-1.5 text-line">·</span>
                {formatKarachiDateTime(entry.createdAt)}
              </p>
              {entry.reason ? (
                <p className="mt-1 text-[12px] text-ink">{entry.reason}</p>
              ) : null}
              {entry.bookingRef ? (
                <p className="mt-1 text-[12px] text-ink-muted">
                  Booking ref {entry.bookingRef}
                </p>
              ) : null}
              {entry.soldPricePkr ? (
                <p className="text-[12px] text-ink-muted tabular-nums">
                  Sold price {formatPkrLedger(entry.soldPricePkr)}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
