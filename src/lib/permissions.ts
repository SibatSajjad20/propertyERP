import { ForbiddenError } from "./errors";
import type { UserRole } from "@/db/schema/enums";

export const actions = [
  "units.read",
  "units.sell",
  "units.reverse_sale",
  "units.change_status",
  "units.update_rate",
  "units.import",
  "structure.read",
  "structure.manage",
  "users.read",
  "users.manage",
  "audit.read",
  "dashboard.read",
] as const;

export type Action = (typeof actions)[number];

const matrix: Record<Action, readonly UserRole[]> = {
  "units.read": ["ADMIN", "INVENTORY_MANAGER", "SALES"],
  "units.sell": ["ADMIN", "SALES"],
  "units.reverse_sale": ["ADMIN"],
  "units.change_status": ["ADMIN", "INVENTORY_MANAGER", "SALES"],
  "units.update_rate": ["ADMIN", "INVENTORY_MANAGER"],
  "units.import": ["ADMIN", "INVENTORY_MANAGER"],
  "structure.read": ["ADMIN", "INVENTORY_MANAGER", "SALES"],
  "structure.manage": ["ADMIN", "INVENTORY_MANAGER"],
  "users.read": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "audit.read": ["ADMIN"],
  "dashboard.read": ["ADMIN", "INVENTORY_MANAGER", "SALES"],
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
