import { z } from "zod";
import { unitStatuses } from "@/db/schema/enums";

export const changeUnitStatusSchema = z.object({
  unitId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  toStatus: z.enum(unitStatuses),
  reason: z.string().trim().min(1).max(500).optional(),
});

export type ChangeUnitStatusInput = z.infer<typeof changeUnitStatusSchema>;
