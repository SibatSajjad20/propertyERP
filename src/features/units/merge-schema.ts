import { z } from "zod";
import { parseDecimal } from "@/lib/money";
import { DECIMAL_PATTERN, POSITIVE_DECIMAL_PATTERN, unitCodeSchema } from "./schema";

const positiveArea = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(POSITIVE_DECIMAL_PATTERN, "Use a positive area with up to 2 decimal places")
  .refine((v) => parseDecimal(v) > 0n, "Area must be greater than 0");

const moneyField = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(DECIMAL_PATTERN, "Use rupees with up to 2 decimal places");

export const createMergeRequestSchema = z
  .object({
    sourceUnitIds: z
      .array(z.string().uuid())
      .min(2, "Select at least 2 units to merge")
      .max(3, "You can merge at most 3 units at once")
      .refine((ids) => new Set(ids).size === ids.length, "Duplicate units selected"),
    proposedUnitCode: unitCodeSchema,
    proposedUnitNumber: z.string().trim().min(1, "Unit number is required").max(64),
    targetFloorId: z.string().uuid("Select a target floor"),
    targetCategoryId: z.string().uuid("Select a target category"),
    proposedNetAreaSqft: positiveArea,
    proposedGrossAreaSqft: positiveArea,
    proposedRatePerSqftPkr: moneyField.refine(
      (v) => parseDecimal(v) >= 0n,
      "Rate cannot be negative",
    ),
    proposedPriceAdjustmentPkr: moneyField.optional().default("0"),
    proposedPriceAdjustmentReason: z
      .string()
      .trim()
      .max(500)
      .transform((v) => (v.length === 0 ? null : v))
      .nullable()
      .optional(),
    reason: z
      .string()
      .trim()
      .min(5, "Provide a clear reason (at least 5 characters)")
      .max(1000),
    proofStoragePath: z.string().trim().min(1, "Proof document upload is required"),
    proofMimeType: z.string().trim().min(1),
    proofFileName: z.string().trim().max(200).optional().nullable(),
    approveImmediately: z.boolean().optional().default(false),
  })
  .superRefine((val, ctx) => {
    if (
      parseDecimal(val.proposedPriceAdjustmentPkr ?? "0") !== 0n &&
      !val.proposedPriceAdjustmentReason
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["proposedPriceAdjustmentReason"],
        message: "A reason is required when price adjustment is non-zero.",
      });
    }
  });

export const approveMergeRequestSchema = z.object({
  mergeRequestId: z.string().uuid(),
  // Optional admin overrides before execution
  proposedUnitCode: unitCodeSchema.optional(),
  proposedUnitNumber: z.string().trim().min(1).max(64).optional(),
  targetFloorId: z.string().uuid().optional(),
  targetCategoryId: z.string().uuid().optional(),
  proposedNetAreaSqft: positiveArea.optional(),
  proposedGrossAreaSqft: positiveArea.optional(),
  proposedRatePerSqftPkr: moneyField.optional(),
  proposedPriceAdjustmentPkr: moneyField.optional(),
  proposedPriceAdjustmentReason: z.string().trim().max(500).nullable().optional(),
});

export const rejectMergeRequestSchema = z.object({
  mergeRequestId: z.string().uuid(),
  rejectionReason: z
    .string()
    .trim()
    .min(5, "Please provide a rejection reason (at least 5 characters)")
    .max(1000),
});

export const createMergeProofUrlSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  fileName: z.string().trim().min(1).max(200),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
});

export type CreateMergeRequestInput = z.infer<typeof createMergeRequestSchema>;
export type ApproveMergeRequestInput = z.infer<typeof approveMergeRequestSchema>;
export type RejectMergeRequestInput = z.infer<typeof rejectMergeRequestSchema>;
