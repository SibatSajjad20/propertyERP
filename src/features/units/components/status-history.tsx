import { formatKarachiDateTime } from "@/lib/datetime";
import { formatPkrLedger } from "@/lib/money";
import { UnitStatusBadge } from "@/components/ui/unit-status-badge";
import type { StatusHistoryEntry } from "../types";

type StatusHistoryProps = {
  entries: StatusHistoryEntry[];
};

function formatStatusLabel(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "BOOKED":
      return "Booked";
    case "SOLD":
      return "Sold";
    default:
      return status;
  }
}

export function StatusHistory({ entries }: StatusHistoryProps) {
  return (
    <div className="mt-4 pt-2">
      {entries.length === 0 ? (
        <p className="py-2 text-[13px] text-ink-muted">No status changes recorded yet.</p>
      ) : (
        <ol className="relative ml-2 space-y-0 border-l border-line">
          {entries.map((entry) => (
            <li key={entry.id} className="relative pb-6 pl-5 last:pb-1">
              <span
                className="absolute top-1 -left-[3.5px] size-1.5 rounded-full bg-primary ring-4 ring-surface"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="sr-only">
                  {formatStatusLabel(entry.fromStatus)} →{" "}
                  {formatStatusLabel(entry.toStatus)}
                </span>
                <span className="text-[12px] font-medium text-ink-muted">
                  Transition:
                </span>
                <UnitStatusBadge status={entry.fromStatus} />
                <span className="text-[12px] text-ink-muted">→</span>
                <UnitStatusBadge status={entry.toStatus} />
              </div>

              <p className="mt-1.5 text-[12px] text-ink-muted">
                <span className="font-medium text-ink">
                  {entry.actorName ?? "System"}
                </span>
                <span className="mx-1.5 text-line-strong">·</span>
                <span>{formatKarachiDateTime(entry.createdAt)}</span>
              </p>

              {entry.reason ? (
                <p className="mt-1.5 rounded-[4px] border border-line bg-subtle/50 px-2.5 py-1.5 text-[12px] text-ink">
                  {entry.reason}
                </p>
              ) : null}

              {entry.bookingRef ? (
                <p className="mt-1 text-[12px] text-ink-muted">
                  Booking ref{" "}
                  <span className="unit-code font-mono font-medium text-ink">
                    {entry.bookingRef}
                  </span>
                </p>
              ) : null}

              {entry.soldPricePkr ? (
                <p className="mt-0.5 text-[12px] text-ink-muted tabular-nums">
                  Sold price{" "}
                  <span className="font-semibold text-ink">
                    {formatPkrLedger(entry.soldPricePkr)}
                  </span>
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
