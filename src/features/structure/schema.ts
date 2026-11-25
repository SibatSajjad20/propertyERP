import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(80);
const levelSchema = z.coerce.number().int().min(0).max(200);

export const createPropertySchema = z.object({
  name: nameSchema,
});

export const updatePropertySchema = z.object({
  id: z.uuid(),
  name: nameSchema,
});

export const archivePropertySchema = z.object({
  id: z.uuid(),
});

export const createBlockSchema = z.object({
  propertyId: z.uuid(),
  name: nameSchema,
});

export const updateBlockSchema = z.object({
  id: z.uuid(),
  name: nameSchema,
});

export const archiveBlockSchema = z.object({
  id: z.uuid(),
});

export const createFloorSchema = z.object({
  blockId: z.uuid(),
  level: levelSchema,
  name: nameSchema.optional(),
});

export const updateFloorSchema = z.object({
  id: z.uuid(),
  level: levelSchema,
  name: nameSchema,
});

export const archiveFloorSchema = z.object({
  id: z.uuid(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type CreateFloorInput = z.infer<typeof createFloorSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;

export const updateFloorRatesSchema = z.object({
  floorId: z.uuid(),
  categoryId: z.uuid().optional().nullable(),
  newRatePerSqftPkr: z
    .string()
    .trim()
    .min(1, "Rate is required")
    .refine((val) => {
      const clean = val.replace(/,/g, "");
      return /^\d+(\.\d{1,2})?$/.test(clean) && Number(clean) > 0;
    }, "Rate must be a positive number"),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(200, "Reason cannot exceed 200 characters"),
  includeSoldBooked: z.boolean().default(false),
});

export type UpdateFloorRatesInput = z.infer<typeof updateFloorRatesSchema>;

export type FloorRateCategorySummary = {
  categoryId: string;
  categoryName: string;
  totalUnits: number;
  availableUnits: number;
  minRate: string | null;
  maxRate: string | null;
};

export type FloorRateSummary = {
  floorId: string;
  floorName: string;
  floorLevel: number;
  blockName: string;
  propertyName: string;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  bookedUnits: number;
  soldUnits: number;
  categories: FloorRateCategorySummary[];
  overallMinRate: string | null;
  overallMaxRate: string | null;
};
