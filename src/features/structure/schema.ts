import { z } from "zod";

export const createBlockSchema = z.object({
  propertyId: z.uuid(),
  name: z.string().trim().min(1).max(80),
});
