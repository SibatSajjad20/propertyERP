import { pgEnum } from "drizzle-orm/pg-core";

export const userRoles = ["ADMIN", "INVENTORY_MANAGER", "SALES"] as const;
export type UserRole = (typeof userRoles)[number];
export const userRoleEnum = pgEnum("user_role", userRoles);

export const unitStatuses = ["AVAILABLE", "SOLD"] as const;
export type UnitStatus = (typeof unitStatuses)[number];
export const unitStatusEnum = pgEnum("unit_status", unitStatuses);

export const auditActions = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "SALE",
  "REVERSE_SALE",
  "IMPORT",
] as const;
export type AuditAction = (typeof auditActions)[number];
export const auditActionEnum = pgEnum("audit_action", auditActions);
