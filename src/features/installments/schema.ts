import { z } from "zod";
import { paymentMethods } from "@/db/schema/enums";

const moneyPattern = z
  .string()
  .min(1, "Amount is required")
  .transform((v) => v.replace(/,/g, ""))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Invalid PKR amount format");

export const recordInstallmentPaymentSchema = z.object({
  bookingId: z.string().uuid("Valid booking ID is required"),
  amountPkr: moneyPattern,
  method: z.enum(paymentMethods, {
    message: "Valid payment method is required",
  }),
  chequeNo: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type RecordInstallmentPaymentInput = z.infer<
  typeof recordInstallmentPaymentSchema
>;

export const editPaymentSchema = z.object({
  paymentId: z.string().uuid("Valid payment ID is required"),
  amountPkr: moneyPattern,
  method: z.enum(paymentMethods, {
    message: "Valid payment method is required",
  }),
  chequeNo: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

export type EditPaymentInput = z.infer<typeof editPaymentSchema>;

export const voidPaymentSchema = z.object({
  paymentId: z.string().uuid("Valid payment ID is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;

export const rescheduleInstallmentsSchema = z.object({
  bookingId: z.string().uuid("Valid booking ID is required"),
  installments: z
    .array(
      z.object({
        seq: z.number().int().positive(),
        dueDate: z.string().min(1, "Due date is required"),
        amountPkr: z
          .string()
          .transform((v) => v.replace(/,/g, ""))
          .refine(
            (v) => /^\d+(\.\d{1,2})?$/.test(v),
            "Invalid installment amount format",
          ),
      }),
    )
    .min(1, "At least one installment is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

export type RescheduleInstallmentsInput = z.infer<typeof rescheduleInstallmentsSchema>;

export const searchInstallmentsSchema = z.object({
  q: z.string().optional(),
});

export type SearchInstallmentsInput = z.infer<typeof searchInstallmentsSchema>;
