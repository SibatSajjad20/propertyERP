import { z } from "zod";
import { passwordSchema } from "@/features/users/schema";

export const updateOwnNameSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "Choose a new password that is different from the current one.",
  });

export type UpdateOwnNameInput = z.infer<typeof updateOwnNameSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;
