import type { UnitStatus } from "@/db/schema/enums";
import { ValidationError } from "@/lib/errors";

/**
 * Allowed status transitions. Extend here when RESERVED / BOOKED land.
 * Nothing else may write `units.status` — go through `changeUnitStatus`.
 */
export const STATUS_TRANSITIONS = {
  AVAILABLE: ["SOLD"],
  SOLD: ["AVAILABLE"],
} as const satisfies Record<UnitStatus, readonly UnitStatus[]>;

export function canTransition(from: UnitStatus, to: UnitStatus): boolean {
  return (STATUS_TRANSITIONS[from] as readonly UnitStatus[]).includes(to);
}

export function assertTransition(from: UnitStatus, to: UnitStatus): void {
  if (!canTransition(from, to)) {
    throw new ValidationError(`Cannot change status from ${from} to ${to}.`);
  }
}

export const REVERSE_REASON_MIN = 10;
export const NOT_SELLABLE_MESSAGE = "This unit is not sellable.";
export const BOOKING_REF_REQUIRED_MESSAGE =
  "Booking ref is required to mark a unit as sold.";
export const REVERSE_REASON_MESSAGE =
  "A reason of at least 10 characters is required to reverse a sale.";
