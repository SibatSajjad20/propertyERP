import { z } from "zod";
import { auditActions } from "@/db/schema/enums";

export const auditFilterSchema = z.object({
  actorId: z.string().optional(),
  entity: z.string().optional(),
  action: z.enum(auditActions).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
