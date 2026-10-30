import { z } from "zod";
import { auditActions } from "@/db/schema/enums";

export const auditFilterSchema = z.object({
  actorId: z.string().optional(),
  entity: z.string().optional(),
  action: z.enum(auditActions).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
