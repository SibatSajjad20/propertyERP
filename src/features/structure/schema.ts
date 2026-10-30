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
