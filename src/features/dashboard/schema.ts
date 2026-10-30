import { z } from "zod";

export const dashboardFilterSchema = z.object({
  propertyId: z.string().uuid().optional().or(z.literal("")),
  blockId: z.string().uuid().optional().or(z.literal("")),
});

export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;

export const exportQuerySchema = z.object({
  type: z.enum(["inventory", "sold", "floors"]),
  format: z.enum(["xlsx", "csv"]),
  propertyId: z.string().uuid().optional().or(z.literal("")),
  blockId: z.string().uuid().optional().or(z.literal("")),
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;
