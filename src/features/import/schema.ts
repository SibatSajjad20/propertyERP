import { z } from "zod";

export const importPreviewSchema = z.object({
  fileName: z.string().min(1),
});

export const importColumnMappingSchema = z.object({
  unitCode: z.string().nullable().default(null),
  unitNumber: z.string().nullable().default(null),
  floor: z.string().nullable().default(null),
  block: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  netAreaSqft: z.string().nullable().default(null),
  grossAreaSqft: z.string().nullable().default(null),
  ratePerSqftPkr: z.string().nullable().default(null),
  status: z.string().nullable().default(null),
  buyer: z.string().nullable().default(null),
  soldPricePkr: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export const cleanedRowSchema = z.object({
  rowIndex: z.number().int().nonnegative(),
  unitCode: z.string().min(1),
  unitNumber: z.string().min(1),
  floorName: z.string().min(1),
  blockName: z.string().min(1),
  categoryName: z.string().min(1),
  netAreaSqft: z.string().min(1),
  grossAreaSqft: z.string().nullable(),
  ratePerSqftPkr: z.string().min(1),
  status: z.enum(["AVAILABLE", "SOLD"]),
  buyer: z.string().nullable(),
  soldPricePkr: z.string().nullable(),
  notes: z.string().nullable(),
  isSellable: z.boolean(),
  originalRow: z.record(z.string(), z.unknown()),
});

export const commitImportSchema = z.object({
  fileName: z.string().min(1),
  mode: z.enum(["CREATE_ONLY", "CREATE_AND_UPDATE"]),
  mapping: importColumnMappingSchema,
  rows: z.array(cleanedRowSchema),
});

export const rollbackBatchSchema = z.object({
  batchId: z.string().uuid().optional(),
});
