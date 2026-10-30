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
};

export function can(role: UserRole, action: Action): boolean {
  return matrix[action].includes(role);
}

export function assertCan(role: UserRole, action: Action): void {
  if (!can(role, action)) {
    throw new ForbiddenError();
  }
}

export { matrix as permissionMatrix };
