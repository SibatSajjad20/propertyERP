import { z } from "zod";

export const createAgreementSchema = z
  .object({
    bookingId: z.string().uuid().optional().nullable(),
    saleId: z.string().uuid().optional().nullable(),
    sellerName: z.string().trim().min(2).max(160).default("Mr. Afnan Khan"),
    agreementDate: z.string().optional(),
    anticipatedCompletionDate: z.string().trim().min(2).max(60).default("Feb-2029"),
    buyerNationality: z.string().trim().min(2).max(80).default("Pakistani"),
    nomineeNationality: z.string().trim().min(2).max(80).default("Pakistani"),
    witness1Name: z.string().trim().max(120).optional().nullable(),
    witness2Name: z.string().trim().max(120).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((d) => Boolean(d.bookingId || d.saleId), {
    message: "Please select a linked booking or sale record.",
  });

export const updateAgreementSchema = z.object({
  id: z.string().uuid(),
  sellerName: z.string().trim().min(2).max(160),
  agreementDate: z.string().min(1),
  anticipatedCompletionDate: z.string().trim().min(2).max(60),
  buyerNationality: z.string().trim().min(2).max(80),
  nomineeNationality: z.string().trim().min(2).max(80),
  witness1Name: z.string().trim().max(120).optional().nullable(),
  witness2Name: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createSignedAgreementUploadUrlSchema = z.object({
  agreementId: z.string().uuid(),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  fileName: z.string().trim().min(1).max(200),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
});

export const completeSignedAgreementUploadSchema = z.object({
  agreementId: z.string().uuid(),
  storagePath: z.string().trim().min(1),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  fileName: z.string().trim().min(1).max(200),
});

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof updateAgreementSchema>;
