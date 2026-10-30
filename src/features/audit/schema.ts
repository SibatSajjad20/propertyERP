import { z } from "zod";

export const auditFilterSchema = z.object({
  entity: z.string().optional(),
});
