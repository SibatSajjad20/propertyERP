import { ForbiddenError } from "./errors";
import type { UserRole } from "@/db/schema/enums";
import { userRoles } from "@/db/schema/enums";

export const actions = [
  "units.read",
  "units.manage",
  "units.sell",
  "units.reverse_sale",
  "units.change_status",
  "units.update_rate",
  "units.import",
  "units.export",
  "data.export",
  "structure.read",
  "structure.manage",
  "users.read",
  "users.manage",
  "audit.read",
  "dashboard.read",
  "profile.update",
  // Sales lifecycle actions
  "reservations.read",
  "reservations.create",
  "reservations.cancel",
  "reservations.extend",
  "bookings.read",
  "bookings.create",
  "bookings.cancel",
  "bookings.return",
  "payments.read",
  "payments.create",
  "payments.edit",
  "payments.void",
  "installments.read",
  "installments.reschedule",
  "reports.read",
  "sales.read",
  "sales.create",
  "sales.buyback",
  "sales.large_discount",
] as const;

export type Action = (typeof actions)[number];

const allRoles = userRoles;

const matrix: Record<Action, readonly UserRole[]> = {
  "units.read": allRoles,
  "units.manage": ["ADMIN", "INVENTORY_MANAGER"],
  "units.sell": allRoles,
  "units.reverse_sale": ["ADMIN"],
  "units.change_status": allRoles,
  "units.update_rate": ["ADMIN", "INVENTORY_MANAGER"],
  "units.import": ["ADMIN", "INVENTORY_MANAGER"],
  "units.export": ["ADMIN", "INVENTORY_MANAGER"],
  "data.export": ["ADMIN"],
  "structure.read": allRoles,
  "structure.manage": ["ADMIN", "INVENTORY_MANAGER"],
  "users.read": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "audit.read": ["ADMIN"],
  "dashboard.read": allRoles,
  "profile.update": allRoles,

  // Sales lifecycle permissions:
  // SALES: create reservations, bookings, record payments, view.
  // INVENTORY_MANAGER: same + cancel reservations.
  // ADMIN: everything incl. cancel booking, return, buyback, large discounts.
  "reservations.read": allRoles,
  "reservations.create": allRoles,
  "reservations.cancel": ["ADMIN", "INVENTORY_MANAGER"],
  "reservations.extend": allRoles,

  "bookings.read": allRoles,
  "bookings.create": allRoles,
  "bookings.cancel": ["ADMIN"],
  "bookings.return": ["ADMIN"],

  "payments.read": allRoles,
  "payments.create": allRoles,
  "payments.edit": ["ADMIN"],
  "payments.void": ["ADMIN"],

  "installments.read": allRoles,
  "installments.reschedule": ["ADMIN"],

  "reports.read": allRoles,

  "sales.read": allRoles,
  "sales.create": allRoles,
  "sales.buyback": ["ADMIN"],
  "sales.large_discount": ["ADMIN"],
};

export function can(role: UserRole, action: Action): boolean {
  return matrix[action]?.includes(role) ?? false;
}

export function assertCan(role: UserRole, action: Action): void {
  if (!can(role, action)) {
    throw new ForbiddenError();
  }
}

export { matrix as permissionMatrix };
