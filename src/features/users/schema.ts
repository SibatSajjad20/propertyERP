import { z } from "zod";
import { userRoles } from "@/db/schema/enums";

export const inviteUserSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(80),
  role: z.enum(userRoles),
});
