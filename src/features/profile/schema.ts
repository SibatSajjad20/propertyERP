import { z } from "zod";
import { passwordSchema } from "@/features/users/schema";

export const updateOwnNameSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const changeOwnPasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

export type UpdateOwnNameInput = z.infer<typeof updateOwnNameSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;
