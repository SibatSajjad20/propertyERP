import { z } from "zod";

export const companySettingsSchema = z.object({
  bankName: z.string().trim().max(120),
  accountTitle: z.string().trim().max(160),
  iban: z.string().trim().max(34),
});

export const signatorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Name is required").max(120),
  designation: z.string().trim().min(2, "Designation is required").max(160),
  sortOrder: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const saveCompanySettingsSchema = z.object({
  bankName: z.string().trim().max(120),
  accountTitle: z.string().trim().max(160),
  iban: z.string().trim().max(34),
  signatories: z.array(signatorySchema).min(1, "At least one signatory is required"),
});
