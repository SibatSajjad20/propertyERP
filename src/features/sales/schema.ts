/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { z } from "zod";
import {
  bookingStatuses,
  discountTypes,
  paymentMethods,
  paymentPlans,
  reservationStatuses,
} from "@/db/schema/enums";

export const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
export const PHONE_REGEX = /^((\+92)|(0092)|(0))?3\d{2}[-.\s]?\d{7}$/;
export const DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/;
export const POSITIVE_DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Normalizes any 13-digit string into the standard Pakistani CNIC format (12345-1234567-1).
 * If the input already has dashes or is not exactly 13 digits, it trims whitespace.
 */
export function formatCnic(val: unknown): string {
  if (typeof val !== "string") return "";
  const trimmed = val.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  return trimmed;
}

export const clientSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  cnic: z.preprocess(
    formatCnic,
    z
      .string()
      .trim()
      .regex(
        CNIC_REGEX,
        "CNIC must be 13 digits matching format 12345-1234567-1 (e.g. 35201-1234567-1)",
      ),
  ),
  phone: z.string().trim().min(10, "Phone number is required").max(20),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(120)
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  homeAddress: z.string().trim().min(5, "Home address is required").max(300),
  postalAddress: z.string().trim().min(5, "Postal address is required").max(300),
});

export const nextOfKinSchema = z.object({
  name: z.string().trim().min(2, "Next of kin name is required").max(120),
  relation: z.string().trim().min(2, "Relation is required").max(60),
  cnic: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? formatCnic(val) : val),
    z
      .string()
      .trim()
      .regex(
        CNIC_REGEX,
        "CNIC must be 13 digits matching format 12345-1234567-1 (e.g. 35201-1234567-1)",
      )
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val))
      .nullable()
      .optional(),
  ),
  phone: z.string().trim().min(10, "Phone number is required").max(20),
  address: z
    .string()
    .trim()
    .max(300)
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
});

export const createReservationSchema = z.object({
  unitId: z.string().uuid(),
  client: clientSchema,
  nextOfKin: nextOfKinSchema.optional(),
  durationDays: z.number().int().min(1).max(365),
  customExpiryDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const cancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().trim().min(5, "A reason of at least 5 characters is required"),
});

export const extendReservationSchema = z.object({
  reservationId: z.string().uuid(),
  additionalDays: z.number().int().min(1).max(180),
});

const moneyField = (msg: string) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/,/g, ""))
    .refine((v) => POSITIVE_DECIMAL_PATTERN.test(v), msg);

const optionalMoneyField = (msg: string) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/,/g, ""))
    .refine((v) => v === "" || POSITIVE_DECIMAL_PATTERN.test(v), msg)
    .optional();

export const createBookingSchema = z.object({
  unitId: z.string().uuid(),
  reservationId: z.string().uuid().optional(),
  client: clientSchema,
  nextOfKin: nextOfKinSchema.optional(),
  discountType: z.enum(discountTypes).optional(),
  discountValue: optionalMoneyField("Invalid discount value"),
  discountReason: z.string().trim().max(300).optional(),
  downPaymentPkr: moneyField("Down payment must be a valid amount"),
  possessionAmountPkr: optionalMoneyField("Possession amount must be a valid amount"),
  plan: z.enum(paymentPlans),
  installmentCount: z.number().int().min(1).max(120),
  startDate: z.string().min(1, "Start date is required"),
  paymentMethod: z.enum(paymentMethods).default("CASH"),
  chequeNo: z.string().trim().max(50).optional(),
  bank: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const recordPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amountPkr: moneyField("Amount must be greater than 0"),
  method: z.enum(paymentMethods),
  chequeNo: z.string().trim().max(50).optional(),
  bank: z.string().trim().max(100).optional(),
  paidAt: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const returnBookingSchema = z.object({
  bookingId: z.string().uuid(),
  deductionType: z.enum(["AMOUNT", "PERCENT"]),
  deductionValue: moneyField("Deduction value must be valid"),
  method: z.enum(paymentMethods),
  chequeNo: z.string().trim().max(50).optional(),
  bank: z.string().trim().max(100).optional(),
  reason: z.string().trim().min(10, "A reason of at least 10 characters is required"),
});

export const createDirectSaleSchema = z.object({
  unitId: z.string().uuid(),
  client: clientSchema,
  nextOfKin: nextOfKinSchema.optional(),
  salePricePkr: moneyField("Sale price must be valid"),
  priceAdjustmentReason: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(paymentMethods).default("CASH"),
  chequeNo: z.string().trim().max(50).optional(),
  bank: z.string().trim().max(100).optional(),
});

export const buybackSaleSchema = z.object({
  unitId: z.string().uuid(),
  saleId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  buybackAmountPkr: moneyField("Buyback amount must be valid"),
  method: z.enum(paymentMethods),
  chequeNo: z.string().trim().max(50).optional(),
  bank: z.string().trim().max(100).optional(),
  paidAt: z.string().optional(),
  reason: z.string().trim().min(10, "A reason of at least 10 characters is required"),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type NextOfKinInput = z.infer<typeof nextOfKinSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ReturnBookingInput = z.infer<typeof returnBookingSchema>;
export type CreateDirectSaleInput = z.infer<typeof createDirectSaleSchema>;
export type BuybackSaleInput = z.infer<typeof buybackSaleSchema>;
