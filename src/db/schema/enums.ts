import { pgEnum } from "drizzle-orm/pg-core";

export const userRoles = ["ADMIN", "INVENTORY_MANAGER", "SALES"] as const;
export type UserRole = (typeof userRoles)[number];
export const userRoleEnum = pgEnum("user_role", userRoles);

export const unitStatuses = ["AVAILABLE", "RESERVED", "BOOKED", "SOLD"] as const;
export type UnitStatus = (typeof unitStatuses)[number];
export const unitStatusEnum = pgEnum("unit_status", unitStatuses);

export const reservationStatuses = [
  "ACTIVE",
  "CONVERTED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];
export const reservationStatusEnum = pgEnum("reservation_status", reservationStatuses);

export const bookingStatuses = ["ACTIVE", "COMPLETED", "CANCELLED", "RETURNED"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export const bookingStatusEnum = pgEnum("booking_status", bookingStatuses);

export const installmentStatuses = [
  "PENDING",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;
export type InstallmentStatus = (typeof installmentStatuses)[number];
export const installmentStatusEnum = pgEnum("installment_status", installmentStatuses);

export const paymentMethods = ["CASH", "CHEQUE", "BANK_TRANSFER"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
export const paymentMethodEnum = pgEnum("payment_method", paymentMethods);

export const paymentPlans = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL"] as const;
export type PaymentPlan = (typeof paymentPlans)[number];
export const paymentPlanEnum = pgEnum("payment_plan", paymentPlans);

export const discountTypes = ["AMOUNT", "PERCENT"] as const;
export type DiscountType = (typeof discountTypes)[number];
export const discountTypeEnum = pgEnum("discount_type", discountTypes);

export const saleStatuses = ["ACTIVE", "BOUGHT_BACK"] as const;
export type SaleStatus = (typeof saleStatuses)[number];
export const saleStatusEnum = pgEnum("sale_status", saleStatuses);

export const auditActions = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "SALE",
  "REVERSE_SALE",
  "IMPORT",
  "RESERVATION_CREATE",
  "RESERVATION_CANCEL",
  "RESERVATION_EXTEND",
  "BOOKING_CREATE",
  "BOOKING_CANCEL",
  "BOOKING_RETURN",
  "PAYMENT_RECORD",
  "BUYBACK",
  "PAYMENT_VOID",
  "PAYMENT_EDIT",
  "INSTALLMENT_RESCHEDULE",
] as const;
export type AuditAction = (typeof auditActions)[number];
export const auditActionEnum = pgEnum("audit_action", auditActions);
