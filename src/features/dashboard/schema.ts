import { z } from "zod";

export const dashboardFilterSchema = z.object({
  propertyId: z.uuid().optional(),
});
