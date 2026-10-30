import { ValidationError } from "@/lib/errors";
import type { UserRole } from "@/db/schema/enums";

export const LAST_ADMIN_MESSAGE =
  "There must always be at least one active administrator.";
export const SELF_DEMOTE_MESSAGE = "You cannot change your own role.";
export const SELF_DISABLE_MESSAGE = "You cannot disable your own account.";

export function nextActiveAdminCount(input: {
  nextRole: UserRole;
  nextDisabled: boolean;
  otherActiveAdmins: number;
}): number {
  const willBeActiveAdmin = input.nextRole === "ADMIN" && !input.nextDisabled;
  return input.otherActiveAdmins + (willBeActiveAdmin ? 1 : 0);
}

export function assertNotSelfRoleChange(actorId: string, targetId: string): void {
  if (actorId === targetId) {
    throw new ValidationError(SELF_DEMOTE_MESSAGE);
  }
}

export function assertNotSelfDisable(actorId: string, targetId: string): void {
  if (actorId === targetId) {
    throw new ValidationError(SELF_DISABLE_MESSAGE);
  }
}

export function assertActiveAdminRemains(count: number): void {
  if (count < 1) {
    throw new ValidationError(LAST_ADMIN_MESSAGE);
  }
}
